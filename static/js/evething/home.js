(function() {
"use strict";

/* global $: false */
/* global EVEThing */
/* global Handlebars: false */

/* Django CSRF Handleing */
function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

$.ajaxSetup({
    crossDomain: false, // obviates need for sameOrigin test
    beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type)) {
            xhr.setRequestHeader("X-CSRFToken", $.cookie('csrftoken'));
        }
    }
});

Handlebars.registerHelper('lookup', function(dict, key) {
    if (dict.hasOwnProperty(key)) return dict[key];
    return key;
});

Handlebars.registerHelper('corp', function(key) {
    if (EVEthing.home.CORPORATIONS.hasOwnProperty(key)) {
        var corp = EVEthing.home.CORPORATIONS[key];

        var out = '[' + corp.ticker + '] ' + corp.name;

        if (EVEthing.home.ALLIANCES.hasOwnProperty(corp.alliance)) {
            var alliance = EVEthing.home.ALLIANCES[corp.alliance];

            out = out + '<br/> (' + alliance.short_name + ') ' + alliance.name;
        }
        return out;
    }
    return key;
});

Handlebars.registerHelper('systems_details', function(name) {
    if (EVEthing.home.SYSTEMS.hasOwnProperty(name)) {
        return name + ' - ' + EVEthing.home.SYSTEMS[name].constellation + ' - ' + EVEthing.home.SYSTEMS[name].region;
    }
    return '';
});

Handlebars.registerHelper('roman', function(num) {
    /* http://blog.stevenlevithan.com/archives/javascript-roman-numeral-converter */
    if (!+num) // jshint ignore:line
        return false;
    var digits = String(+num).split(""),
        key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM",
               "","X","XX","XXX","XL","L","LX","LXX","LXXX","XC",
               "","I","II","III","IV","V","VI","VII","VIII","IX"],
        roman = "",
        i = 3;
    while (i--)
        roman = (key[+digits.pop() + (i * 10)] || "") + roman;
    return new Array(+digits.join("") + 1).join("M") + roman;
});

Handlebars.registerHelper('comma', function(x) {
    if (x === null) return '';
    x =  String(x);

    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
});

Handlebars.registerHelper('security', function(security) {
    var cssClass = '';
    var title = '';

    if (security <= -2.0) {
        cssClass = 'text-warning';
        title += 'Will be attacked ';

        if (security <= -5.0) {
            title += 'anywhere in highsec.';
        } else {
            title += ' in ';
            if (security <= -4.5) {
                title += '0.5';
            } else if (security <= -4.0) {
                title += '0.6';
            } else if (security <= -3.5) {
                title += '0.7';
            } else if (security <= -3.0) {
                title += '0.8';
            } else if (security <= -2.5) {
                title += '0.9';
            } else if (security <= -2.0) {
                title += '1.0';
            }
            title += ' systems and above.';
        }
    } else {
        cssClass = 'text-success';
        title += 'No travel restrictions.';
    }

    var out = '<span class="small pull-right sensitive security {{cssClass}}" rel="tooltip" title="{{title}}" data-content="">{{security}}</span>';
    out = out.replace('{{cssClass}}', cssClass);
    out = out.replace('{{title}}', title);
    out = out.replace('{{security}}', security);

    return new Handlebars.SafeString(out);
}); 

function __duration(s) {
    var m = Math.floor(s/60);
    s = s % 60;
    var h = Math.floor(m/60);
    m = m % 60;
    var d = Math.floor(h/24);
    h = h % 24;
    
    var parts = [];
    if (d !== 0) parts[parts.length] = d + 'd';
    if (h !== 0) parts[parts.length] = h + 'h';
    if (m !== 0) parts[parts.length] = m + 'm';
    if (s !== 0) parts[parts.length] = s + 's';
    
    return parts;
}

Handlebars.registerHelper('duration', function(s) {
    return __duration(s).join(' ');
});

Handlebars.registerHelper('shortduration', function(s) {
    var parts = __duration(s);
    var bits = [];
    if (parts.length > 2) {
        bits[0] = parts[0];
        bits[1] = parts[1];
    } else {
        bits = parts;
    }
    return bits.join(' ');
});

if (typeof(EVEthing.home) === 'undefined') { EVEthing.home = {}; }

EVEthing.home.ONE_DAY = 24*60*60;
EVEthing.home.EXPIRE_WARNING = 10 * 24*60*60;

EVEthing.home.SP_PER_LEVEL = {
    0: 0,
    1: 250,
    2: 1415,
    3: 8000,
    4: 45255,
    5: 256000,
};

EVEthing.home.SORT_PROFILE_TO_FUNC_MAP = {
    'skillqueue': 'skill_queue',
    'apiname': 'api_name',
    'charname': 'char_name',
    'corpname': 'corp_name',
    'totalsp': 'total_sp',
    'wallet': 'wallet_balance',
};

EVEthing.home.FUNC_TO_SORT_PROFILE_MAP = {};
EVEthing.home.UPDATE_CHECK_PERIOD = 60 * 5;
EVEthing.home.IGNORE_GROUPS = false;
EVEthing.home.SHIPS = {};
EVEthing.home.CORPORATIONS = {};
EVEthing.home.ALLIANCES = {};
EVEthing.home.SYSTEMS = {};
EVEthing.home.CHARACTERS = {};
EVEthing.home.EVENTS = [];

EVEthing.home.CHARACTER_TEMPLATE = Handlebars.getTemplate('home_character');

EVEthing.home.CHARACTER_ORDER = [];

EVEthing.home.REFRESH_HINTS = {
    'skill_queue': {},
    'character': {},
};

// CSS class:text mapping
EVEthing.home.REPLACEMENTS = {
    'character-name': 'Character Name',
    'apikey-name': 'API name',
    'corporation-name': 'Corporation Name [TICKR]',
    'character-location': 'Hoth -- X-Wing',
    'wallet-division': 'Hookers & Blow',
    'user-name': 'Mr. User',
};

EVEthing.home.SUCCESS_CSS_CLASS = "";
EVEthing.home.WARNING_CSS_CLASS = "";
EVEthing.home.ERROR_CSS_CLASS = "";

EVEthing.home.PROFILE = {};

EVEthing.home.DEFAULTS = {
    'PROFILE': {
        'CHAR_COL_SPAN': 3,
        'HOME_CHARS_PER_ROW': 4,

        'HOME_SHOW_LOCATIONS': true,
        'HOME_SHOW_SEPARATORS': true,
        'HOME_SHOW_SECURITY': true,

        'HOME_SORT_ORDER': 'apiname',
        'HOME_SORT_DESCENDING': false,
        'HOME_SORT_EMPTY_QUEUE_LAST': false,

        'HOME_HIGHLIGHT_BACKGROUNDS': true,
        'HOME_HIGHLIGHT_BORDER': true,
    },

    'HOME_PAGE_UPDATE_DELAY': null,
};

EVEthing.home.onload = function() {
    var i, j;

    // Apply the default values
    for (i in EVEthing.home.DEFAULTS) {
        if (!EVEthing.home.DEFAULTS.hasOwnProperty(i)) { continue; }

        if (typeof(EVEthing.home.DEFAULTS[i]) === "object") {
            if (typeof(EVEthing.home[i]) === "object") {
                for (j in EVEthing.home[i]) {
                    if (!EVEthing.home[i].hasOwnProperty(j)) { continue; }
    
                    if (!EVEthing.home.hasOwnProperty(i)) {
                        EVEthing.home[i][j] = EVEthing.home.DEFAULTS[i][j];
                    }
                }
            } else {
                EVEthing.home[i] = EVEthing.home.DEFAULTS[i];
            }
        } else {
            if (!EVEthing.home.hasOwnProperty(i)) {
                EVEthing.home[i] = EVEthing.home.DEFAULTS[i];
            }
        }
    }

    // Bind screenshot mode button
    $('body').on('click', '.js-screenshot', EVEthing.home.screenshot_mode);

    // Lets normalise some values...
    EVEthing.home.PROFILE.HOME_SORT_ORDER = EVEthing.home.SORT_PROFILE_TO_FUNC_MAP[EVEthing.home.PROFILE.HOME_SORT_ORDER];

    EVEthing.home.initialLoad();

    var cookies = document.cookie.split(/[;\s|=]/);

    var home_page_sort_by_cookie = $.cookie('homePageSortBy');
    if (home_page_sort_by_cookie !== null && typeof(home_page_sort_by_cookie) !== 'undefined') {
        if (typeof(EVEthing.home.character_ordering[home_page_sort_by_cookie]) !== 'undefined') {
            EVEthing.home.PROFILE.HOME_SORT_ORDER = home_page_sort_by_cookie;
        }
        EVEthing.home.PROFILE.HOME_SORT_DESCENDING = $.cookie('homePageSortOrder') == 'desc';
    }
    var indexOfSortEmptyQueueLast = cookies.indexOf('homePageSortEmptyQueueLast');
    if (indexOfSortEmptyQueueLast >= 0) {
        if (cookies[indexOfSortEmptyQueueLast + 1] == 'true') {
            EVEthing.home.PROFILE.HOME_SORT_EMPTY_QUEUE_LAST = true;
        } else if (cookies[indexOfSortEmptyQueueLast + 1] == 'false') {
            EVEthing.home.PROFILE.HOME_SORT_EMPTY_QUEUE_LAST = false;
        }
    }
    var indexOfIgnoreGroups = cookies.indexOf('homePageIgnoreGroups');
    if (indexOfIgnoreGroups >= 0) {
        if (cookies[indexOfIgnoreGroups + 1] == 'true') {
            EVEthing.home.IGNORE_GROUPS = true;
        } else if (cookies[indexOfIgnoreGroups + 1] == 'false') {
            EVEthing.home.IGNORE_GROUPS = false;
        }
    }

    var sort_method = EVEthing.home.character_ordering[EVEthing.home.PROFILE.HOME_SORT_ORDER];

    var sortSelect = $('<li class="pull-right dropdown sort-by"><a href="#" class="dropdown-toggle" data-toggle="dropdown"><b class="caret"></b>Sort By: <output></output></a></li>');
    sortSelect.find('output').val(sort_method.NAME + ' ' + (EVEthing.home.PROFILE.HOME_SORT_DESCENDING ? sort_method.NAME_REVERSE : sort_method.NAME_FORWARD));

    var sortSelectMenu = $('<ul class="dropdown-menu"></ul>');
    sortSelect.append(sortSelectMenu);

    for (i in EVEthing.home.character_ordering) {
        if (EVEthing.home.character_ordering.hasOwnProperty(i)) {
            sortSelectMenu.append('<li><a href="#' + i + '">' + EVEthing.home.character_ordering[i].NAME + '</a></li>');
        }
    }

    sortSelectMenu.append('<li class="divider"></li>');
    sortSelectMenu.append('<li><a href="#empty_queue_last"><b class="fa fa-' + (EVEthing.home.PROFILE.HOME_SORT_EMPTY_QUEUE_LAST ? 'check-circle' : 'circle-o' ) + '"></b> Empty Queues Last</a></li>');
    sortSelectMenu.append('<li><a href="#use_groups"><b class="fa fa-' + (EVEthing.home.IGNORE_GROUPS ? 'circle-o' : 'check-circle') + '"></b> Use Groups</a></li>');

    sortSelectMenu.find('a').click(EVEthing.home.onSortByClicked);

    $('ul.summary-row li.pull-right').after(sortSelect);

    if (EVEthing.home.PROFILE.HOME_HIGHLIGHT_BACKGROUNDS) {
        EVEthing.home.SUCCESS_CSS_CLASS += " background-success";
        EVEthing.home.WARNING_CSS_CLASS += " background-warn";
        EVEthing.home.ERROR_CSS_CLASS += " background-error";
    }
    if (EVEthing.home.PROFILE.HOME_HIGHLIGHT_BORDER) {
        EVEthing.home.SUCCESS_CSS_CLASS += " border-success";
        EVEthing.home.WARNING_CSS_CLASS += " border-warn";
        EVEthing.home.ERROR_CSS_CLASS += " border-error";
    }

    // Start the animation loop as though the last frame was 10s ago, to ensure it does an inital render
    window.requestAnimationFrame(function() { EVEthing.home.animate(Math.round(new Date().getTime() / 1000) - 10); });
};

EVEthing.home.lastUpdateCheck = new Date().getTime() / 1000;

EVEthing.home.animate = function(lastFrame) {
    var now = Math.round(new Date().getTime() / 1000);


    // Only do a render pass if it has been more than a second since the last one
    if (now - lastFrame < 1) {
        window.requestAnimationFrame(function() { EVEthing.home.animate(lastFrame); });
    } else {
        window.requestAnimationFrame(function() { EVEthing.home.animate(now); });

        var i;

        var total_sp = 0;
        for (i in EVEthing.home.CHARACTERS) {
            if (EVEthing.home.CHARACTERS.hasOwnProperty(i)) {
                var dyn_data = EVEthing.home.CHARACTERS[i].animate(now);
                
                total_sp = total_sp + dyn_data.total_sp;
            }
        }

        $('output[name="total_sp"]').val(Handlebars.helpers.comma(total_sp) + ' SP');

        for (i in EVEthing.home.EventDisplay.EVENTS) {
            if (!EVEthing.home.EventDisplay.EVENTS.hasOwnProperty(i)) continue;

            EVEthing.home.EventDisplay.EVENTS[i].animate(now);
        }

        if (EVEthing.home.HOME_PAGE_UPDATE_DELAY !== false) {
            if ((now - EVEthing.home.lastUpdateCheck) > EVEthing.home.UPDATE_CHECK_PERIOD) {
                EVEthing.home.lastUpdateCheck = now;

                var characters = {};
                var options = {};

                for (i in EVEthing.home.REFRESH_HINTS.skill_queue) {
                    if (!EVEthing.home.REFRESH_HINTS.skill_queue.hasOwnProperty(i)) continue;

                    // We want to give evething a little bit of time to actually run the update
                    if (EVEthing.home.REFRESH_HINTS.skill_queue[i] < (now + EVEthing.home.HOME_PAGE_UPDATE_DELAY)) {
                        characters[i] = true;
                        options.skill_queues = true;
                    }
                }

                for (i in EVEthing.home.REFRESH_HINTS.character) {
                    if (!EVEthing.home.REFRESH_HINTS.character.hasOwnProperty(i)) continue;

                    // We want to give evething a little bit of time to actually run the update
                    if (EVEthing.home.REFRESH_HINTS.character[i] < (now + EVEthing.home.HOME_PAGE_UPDATE_DELAY)) {
                        characters[i] = true;
                        options.characters = true;
                    }
                }

                EVEthing.home.partialLoad(Object.keys(options), Object.keys(characters));
            }
        }
    }
};

EVEthing.home.onSortByClicked = function(event) {
    event.stopPropagation();
    event.preventDefault();

    var elem = $(event.target);

    if (elem.is('b')) elem = elem.parent();

    var href = elem[0].href.split('#')[1];

    var icon;
    if (href == "use_groups") {
        EVEthing.home.IGNORE_GROUPS = !EVEthing.home.IGNORE_GROUPS;

        icon = $(elem).find('b');
        icon.removeClass('fa fa-circle-o fa-check-circle');
        icon.addClass('fa fa-' + (EVEthing.home.IGNORE_GROUPS ? 'circle-o' : 'check-circle'));

        $.cookie('homePageIgnoreGroups', String(EVEthing.home.IGNORE_GROUPS));
    } else if (href == "empty_queue_last") {
        EVEthing.home.PROFILE.HOME_SORT_EMPTY_QUEUE_LAST = !EVEthing.home.PROFILE.HOME_SORT_EMPTY_QUEUE_LAST;
        
        icon = $(elem).find('b');
        icon.removeClass('fa fa-circle-o fa-check-circle');
        icon.addClass('fa fa-' + (EVEthing.home.PROFILE.HOME_SORT_EMPTY_QUEUE_LAST ? 'check-circle' : 'circle-o' ));

        $.cookie('homePageSortEmptyQueueLast', String(EVEthing.home.PROFILE.HOME_SORT_EMPTY_QUEUE_LAST));
    } else {
        var sort_by = EVEthing.home.character_ordering[href];

        if (sort_by != 'undefined') {
            if (EVEthing.home.PROFILE.HOME_SORT_ORDER == href) {
                EVEthing.home.PROFILE.HOME_SORT_DESCENDING = !EVEthing.home.PROFILE.HOME_SORT_DESCENDING;
            }

            EVEthing.home.PROFILE.HOME_SORT_ORDER = href;

            var out = EVEthing.home.character_ordering[href].NAME;
            out += ' ';
            out += (
                EVEthing.home.PROFILE.HOME_SORT_DESCENDING ?
                EVEthing.home.character_ordering[href].NAME_REVERSE :
                EVEthing.home.character_ordering[href].NAME_FORWARD
            );

            $('li.sort-by output').val(out);

            if (EVEthing.home.PROFILE.HOME_SORT_DESCENDING) {
                EVEthing.home.sort_characters(
                    //EVEthing.home.reverse_ordering(
                        EVEthing.home.character_ordering[href]
                    //)
                );
            } else {
                EVEthing.home.sort_characters(
                    EVEthing.home.character_ordering[href]
                );
            } 

            $.cookie('homePageSortBy', href);
            $.cookie('homePageSortOrder', (EVEthing.home.PROFILE.HOME_SORT_DESCENDING ? 'desc' : 'asc'));    
        }
    }

    EVEthing.home.draw_characters();

    return false;
};

EVEthing.home.draw_characters = function() {
    if (EVEthing.home.CHARACTER_ORDER.length != Object.keys(EVEthing.home.CHARACTERS).length) {
        EVEthing.home.sort_characters();
    }

    if (EVEthing.home.IGNORE_GROUPS) {
        EVEthing.home.GroupDisplay.removeAll();

        EVEthing.home.CharacterListDisplay.draw();
        EVEthing.home.CharacterListDisplay.html.insertAfter('.summary-row');
    } else {
        EVEthing.home.CharacterListDisplay.remove();

        for (var i=0; i<EVEthing.home.GroupDisplay.GROUP_ORDER.length; i++) {
            EVEthing.home.GroupDisplay.GROUPS[EVEthing.home.GroupDisplay.GROUP_ORDER[i]].draw();
            EVEthing.home.GroupDisplay.GROUPS[EVEthing.home.GroupDisplay.GROUP_ORDER[i]].html.insertAfter('.summary-row');
        }
    }
};

EVEthing.home.character_ordering = {};

EVEthing.home.character_ordering.skill_queue = function(a, b) {
    return EVEthing.home.CHARACTERS[a].character.skill_queue_duration - EVEthing.home.CHARACTERS[b].character.skill_queue_duration;
};
EVEthing.home.character_ordering.skill_queue.NAME = 'Skill Queue Duration';
EVEthing.home.character_ordering.skill_queue.NAME_FORWARD = 'Asc';
EVEthing.home.character_ordering.skill_queue.NAME_REVERSE = 'Desc';

EVEthing.home.character_ordering.api_name = function(a, b) {
    return EVEthing.home.CHARACTERS[a].character.apikey.name.localeCompare(EVEthing.home.CHARACTERS[b].character.apikey.name);
};
EVEthing.home.character_ordering.api_name.NAME = 'API Name';
EVEthing.home.character_ordering.api_name.NAME_FORWARD = 'Asc';
EVEthing.home.character_ordering.api_name.NAME_REVERSE = 'Desc';

EVEthing.home.character_ordering.char_name = function(a, b) {
    return EVEthing.home.CHARACTERS[a].character.name.localeCompare(EVEthing.home.CHARACTERS[b].character.name);
};
EVEthing.home.character_ordering.char_name.NAME = 'Character Name';
EVEthing.home.character_ordering.char_name.NAME_FORWARD = 'Asc';
EVEthing.home.character_ordering.char_name.NAME_REVERSE = 'Desc';

EVEthing.home.character_ordering.corp_name = function(a, b) {
    var corp_a = EVEthing.home.CHARACTERS[a].character.corporation;
    var corp_b = EVEthing.home.CHARACTERS[b].character.corporation;
        
    return EVEthing.home.CORPORATIONS[corp_a].name.localeCompare(EVEthing.home.CORPORATIONS[corp_b].name);
};
EVEthing.home.character_ordering.corp_name.NAME = 'Corporation Name';
EVEthing.home.character_ordering.corp_name.NAME_FORWARD = 'Asc';
EVEthing.home.character_ordering.corp_name.NAME_REVERSE = 'Desc';

EVEthing.home.character_ordering.total_sp = function(a, b) {
    return EVEthing.home.CHARACTERS[a].character.details.total_sp - EVEthing.home.CHARACTERS[b].character.details.total_sp;
};
EVEthing.home.character_ordering.total_sp.NAME = 'Total Skill Points';
EVEthing.home.character_ordering.total_sp.NAME_FORWARD = 'Asc';
EVEthing.home.character_ordering.total_sp.NAME_REVERSE = 'Desc';

EVEthing.home.character_ordering.wallet_balance = function(a, b) {
    return EVEthing.home.CHARACTERS[a].character.details.wallet_balance - EVEthing.home.CHARACTERS[b].character.details.wallet_balance;
};
EVEthing.home.character_ordering.wallet_balance.NAME = 'Wallet Ballance';
EVEthing.home.character_ordering.wallet_balance.NAME_FORWARD = 'Asc';
EVEthing.home.character_ordering.wallet_balance.NAME_REVERSE = 'Desc';

EVEthing.home.reverse_ordering = function(method) {
    var m = method;
    return function(a, b) {
        return m(b, a);
    };
};

EVEthing.home.sort_characters = function() {
    if (EVEthing.home.CHARACTER_ORDER.length != EVEthing.home.CHARACTERS.length) {
        EVEthing.home.CHARACTER_ORDER = Object.keys(EVEthing.home.CHARACTERS);
    }
    var methods = [];
    var i;
    for (i in arguments) {
        if (!arguments.hasOwnProperty(i)) continue;
        methods[methods.length] = arguments[i];
    }


    if (methods.length === 0) {
        var sort_method = EVEthing.home.PROFILE.HOME_SORT_ORDER;
        if (EVEthing.home.character_ordering.hasOwnProperty(sort_method)) {
            methods[0] = EVEthing.home.character_ordering[sort_method];
        }
    }

    if (methods.length === 0) {
        for (i in EVEthing.home.character_ordering) {
            if (!EVEthing.home.character_ordering.hasOwnProperty(i)) continue;
            methods[methods.length] = EVEthing.home.character_ordering[i];
        }
    }

    for (i=0; i<methods.length; i++) {
        var method = methods[i];

        if (EVEthing.home.PROFILE.HOME_SORT_DESCENDING) {
            method = EVEthing.home.reverse_ordering(method);
        }

        EVEthing.home.CHARACTER_ORDER.sort(method);
    }
};

EVEthing.home.initialLoad = function() {
    $.get(
        'home/api',
        {
            'options': ['characters','details','corporations','alliances','skill_queues','event_log','summary','systems'],
        },
        EVEthing.home.handleResponse
    );
};

EVEthing.home.partialLoad = function(options, characters) {
    options[options.length] = 'event_log';
    options[options.length] = 'summary';

    options[options.length] = 'corporations';
    options[options.length] = 'alliances';
    options[options.length] = 'systems';

    $.post(
        'home/api',
        {
            'characters': characters,
            'options': options,

            'known_ships': Object.keys(EVEthing.home.SHIPS),
            'known_corporations': Object.keys(EVEthing.home.CORPORATIONS),
            'known_alliances': Object.keys(EVEthing.home.ALLIANCES),
            'known_systems': Object.keys(EVEthing.home.SYSTEMS),
        },
        EVEthing.home.handleResponse
    );
};

EVEthing.home.handleResponse = function(data, textStatus, jqXHR) {
    var i;

    if (data.hasOwnProperty('ships')) {
        EVEthing.home.parseShips(data);
        delete data.ships;
    }
    if (data.hasOwnProperty('alliances')) {
        EVEthing.home.parseAlliances(data);
        delete data.alliances;
    }
    if (data.hasOwnProperty('corporations')) {
        EVEthing.home.parseCorporations(data);
        delete data.corporations;
    }
    if (data.hasOwnProperty('systems')) {
        EVEthing.home.parseSystems(data);
        delete data.systems;
    }

    if (data.hasOwnProperty('refresh_hints')) {
        EVEthing.home.parseRefreshHints(data);
        delete data.refresh_hints;
    }

    if (data.hasOwnProperty('characters')) {
        var total_characters = 0;
        for (i in data.characters) {
            if (!data.characters.hasOwnProperty(i)) continue;

            total_characters++;

            if (EVEthing.home.CHARACTERS.hasOwnProperty(i)) {
                EVEthing.home.CHARACTERS[i].parseResponse(data);
            } else {
                EVEthing.home.CHARACTERS[i] = new EVEthing.home.CharacterDisplay(i, data);
                EVEthing.home.GroupDisplay.addCharacter(EVEthing.home.CHARACTERS[i]);
            }

        }

        var wallet_total = 0;

        for (i in EVEthing.home.CHARACTERS) {
            if (EVEthing.home.CHARACTERS.hasOwnProperty(i)) {
                wallet_total = wallet_total + parseFloat(EVEthing.home.CHARACTERS[i].character.details.wallet_balance);
            }
        }

        if (total_characters > 0) {
            $('output[name="total_wallet"]').val(Handlebars.helpers.comma(wallet_total.toFixed(2)) + ' ISK');
        }
    }

    if (data.hasOwnProperty('events')) {
        for (i=data.events.length-1; i>=0; i--) {
            new EVEthing.home.EventDisplay(data.events[i].text, data.events[i].issued);
        }
    }

    if (data.hasOwnProperty('summary')) {
        if (data.summary.hasOwnProperty('total_assets')) {
            if (data.summary.total_assets !== null) {
                $('output[name="personal_assets"]').val(Handlebars.helpers.comma(data.summary.total_assets) + ' ISK');
            }
        }
    }

    new EVEthing.home.EventDisplay('Data Loaded', Math.round(new Date().getTime() / 1000));

    EVEthing.home.draw_characters();
};

EVEthing.home.parseShips = function(data) {
    for (var i in data.ships) {
        if (!data.ships.hasOwnProperty(i)) continue;
        EVEthing.home.SHIPS[i] = data.ships[i];
    }
};

EVEthing.home.parseAlliances = function(data) {
    for (var i in data.alliances) {
        if (!data.alliances.hasOwnProperty(i)) continue;
        EVEthing.home.ALLIANCES[i] = data.alliances[i];
    }
};

EVEthing.home.parseCorporations = function(data) {
    for (var i in data.corporations) {
        if (!data.corporations.hasOwnProperty(i)) continue;
        EVEthing.home.CORPORATIONS[i] = data.corporations[i];
    }
};

EVEthing.home.parseSystems = function(data) {
    for (var i in data.systems) {
        if (!data.systems.hasOwnProperty(i)) continue;
        EVEthing.home.SYSTEMS[i] = data.systems[i];
    }
};

EVEthing.home.parseRefreshHints = function(data) {
    for (var queue in data.refresh_hints) {
        if (!data.refresh_hints.hasOwnProperty(queue)) continue;

        for (var i in data.refresh_hints[queue]) {
            if (!data.refresh_hints[queue].hasOwnProperty(i)) continue;

            EVEthing.home.REFRESH_HINTS[queue][i] = Math.round(new Date(data.refresh_hints[queue][i] + '+00:00').getTime() / 1000);
        }
    }
};

EVEthing.home.screenshot_mode = function() {
    // replace sensitive data with placeholders
    $('.sensitive').each(function () {
        var $this = $(this);
        var oldname = $this.attr('oldname');
        
        if (oldname === undefined) {
            $this.attr('oldname', $this.text());
            
            var classes = $this.attr('class').split(/\s+/);
            for (var i = 0; i < classes.length; i++) {
                var rep = EVEthing.home.REPLACEMENTS[classes[i]];
                if (rep !== undefined) {
                    $this.text(rep);
                    break;
                }
            }
        }
        else {
            $this.text(oldname);
            $this.removeAttr('oldname');
        }
    });

    var seen_tooltips = [];
    $('.row').each(function() {
        var $row = $(this);

        $('.well', $row).each(function() {
            var $well = $(this);
            var seen = false;

            $('[rel=tooltip]', $well).each(function () {
                var $i = $(this);
                if (seen === false && seen_tooltips[$i.attr('class')] === undefined) {
                    seen = true;
                    seen_tooltips[$i.attr('class')] = true;

                    if ($i.attr('shown') === undefined) {
                        $i.tooltip('show');
                        $i.attr('shown', 'yup');
                    }
                    else {
                        $i.tooltip('hide');
                        $i.removeAttr('shown');
                    }
                }
            });
        });
    });
};

/**
 * Prototype for drawing and laying out characters without groups
 */

EVEthing.home.CharacterListDisplay = {};

EVEthing.home.CharacterListDisplay.draw = function() {
    if (typeof(this.html) == "undefined") this.html = null;
    if (this.html !== null) this.html.remove();

    var i;
    this.html = $('<div class="margin-half-top"></div>');

    //var row = this.html;
    var row = $('<div class="row"></div>');

    var defered_chars = [];
    for (i=0; i < EVEthing.home.CHARACTER_ORDER.length; i++) {
        if (row.children().length >= EVEthing.home.PROFILE.HOME_CHARS_PER_ROW) {
            this.html.append(row);
            row = $('<div class="row"></div>');
        }

        if (EVEthing.home.PROFILE.HOME_SORT_EMPTY_QUEUE_LAST) {
            var defered = true;
            if (EVEthing.home.CHARACTERS[EVEthing.home.CHARACTER_ORDER[i]].character.hasOwnProperty('skill_queue')) {
                if (EVEthing.home.CHARACTERS[EVEthing.home.CHARACTER_ORDER[i]].character.skill_queue.length > 0) {
                    defered = false;
                    row.append(EVEthing.home.CHARACTERS[EVEthing.home.CHARACTER_ORDER[i]].well);
                }
            }
            if (defered) {
                defered_chars[defered_chars.length] = EVEthing.home.CHARACTER_ORDER[i];
            }
        } else {
            row.append(EVEthing.home.CHARACTERS[EVEthing.home.CHARACTER_ORDER[i]].well);
        }

    }

    for (i=0; i < defered_chars.length; i++) {
        if (row.children().length >= EVEthing.home.PROFILE.HOME_CHARS_PER_ROW) {
            this.html.append(row);
            row = $('<div class="row"></div>');
        }
        row.append(EVEthing.home.CHARACTERS[defered_chars[i]].well);
    }

    this.html.append(row);
    this.html.append('<hr />');
};

EVEthing.home.CharacterListDisplay.remove = function() {
    if (typeof(this.html) == "undefined") this.html = null;
    if (this.html !== null) this.html.remove();
};


/**
 * Prototype for drawing and laying out characters in groups
 */
EVEthing.home.GroupDisplay = function(name) {
    this.name = name;
    this.characters = [];

    this.html = null;
};

EVEthing.home.GroupDisplay.GROUP_ORDER = [];
EVEthing.home.GroupDisplay.GROUPS = {};

EVEthing.home.GroupDisplay.addCharacter = function(character) {
    if (!EVEthing.home.GroupDisplay.GROUPS.hasOwnProperty(character.character.config.home_group)) {
        EVEthing.home.GroupDisplay.GROUPS[character.character.config.home_group] = new EVEthing.home.GroupDisplay(character.character.config.home_group);

        EVEthing.home.GroupDisplay.GROUP_ORDER[EVEthing.home.GroupDisplay.GROUP_ORDER.length] = character.character.config.home_group;
        EVEthing.home.GroupDisplay.GROUP_ORDER.sort().reverse();
    }

    EVEthing.home.GroupDisplay.GROUPS[character.character.config.home_group].add(character);
};

EVEthing.home.GroupDisplay.removeAll = function() {
    for (var i in EVEthing.home.GroupDisplay.GROUPS) {
        if (!EVEthing.home.GroupDisplay.GROUPS.hasOwnProperty(i)) continue;

        EVEthing.home.GroupDisplay.GROUPS[i].remove();
    }
};

EVEthing.home.GroupDisplay.prototype.add = function(character) {
    this.characters[this.characters.length] = character.character_id;
};

EVEthing.home.GroupDisplay.prototype.draw = function() {
    if (this.html !== null) this.html.remove();

    var i;

    this.html = $('<div class="margin-half-top clearfix"></div>');
    this.html.append($('<p>' + this.name + '</p>'));
   
    var row = $('<div class="row"></div>');
    //var row = this.html;

    var defered_chars = [];
    for (i=0; i < EVEthing.home.CHARACTER_ORDER.length; i++) {
        if (row.children().length >= EVEthing.home.PROFILE.HOME_CHARS_PER_ROW) {
            this.html.append(row);
            row = $('<div class="row"></div>');
        }

        if (this.characters.indexOf(EVEthing.home.CHARACTER_ORDER[i]) >= 0) {
            if (EVEthing.home.PROFILE.HOME_SORT_EMPTY_QUEUE_LAST) {
                var defered = true;
                if (EVEthing.home.CHARACTERS[EVEthing.home.CHARACTER_ORDER[i]].character.hasOwnProperty('skill_queue')) {
                    if (EVEthing.home.CHARACTERS[EVEthing.home.CHARACTER_ORDER[i]].character.skill_queue.length > 0) {
                        defered = false;
                        row.append(EVEthing.home.CHARACTERS[EVEthing.home.CHARACTER_ORDER[i]].well);
                    }
                }
                if (defered) {
                    defered_chars[defered_chars.length] = EVEthing.home.CHARACTER_ORDER[i];
                }
            } else {
                row.append(EVEthing.home.CHARACTERS[EVEthing.home.CHARACTER_ORDER[i]].well);
            }
        }
    }

    for (i=0; i < defered_chars.length; i++) {
        if (row.children().length >= EVEthing.home.PROFILE.HOME_CHARS_PER_ROW) {
            this.html.append(row);
            row = $('<div class="row"></div>');
        }
        row.append(EVEthing.home.CHARACTERS[defered_chars[i]].well);
    }

    this.html.append(row);
    this.html.append('<hr />');
};

EVEthing.home.GroupDisplay.prototype.remove = function() {
    if (this.html !== null) this.html.remove();
};

/**
 * Prototype for displaying events
 */
EVEthing.home.EventDisplay = function(text, issued) {
    if (String(parseInt(issued)) === String(issued)) {
        this.issued = issued;
    } else {
        this.issued = Math.round(new Date(issued + '+00:00').getTime() / 1000);
    }

    if (EVEthing.home.EventDisplay.EVENTS.hasOwnProperty('' + this.issued + '|' + text)) return;
    
    this.html = $('<li></li>');
    this.age = $('<span></span>');
    this.text = $('<span></span>');
    this.text.html(text);

    this.html.append(this.age);
    this.html.append($('<strong> / </strong>'));
    this.html.append(this.text);

    $('.events').prepend(this.html);

    EVEthing.home.EventDisplay.EVENTS['' + this.issued + '|' + text] = this;
};

EVEthing.home.EventDisplay.EVENTS = {};

EVEthing.home.EventDisplay.prototype.animate = function(now) {
    this.age.text(Handlebars.helpers.shortduration(now - this.issued) + ' ago');
};

/**
 * This prototype is used for displaying the characters on the home page
  */
EVEthing.home.CharacterDisplay = function(character_id, data) {
    this.character_id = character_id;

    this.character = {};

    this.well = $('<div></div>');
    this.well.addClass('col-xs-12');
    this.well.addClass('col-sm-6');
    this.well.addClass('col-md-' + EVEthing.home.PROFILE.CHAR_COL_SPAN);
    this.well.addClass('col-lg-' + EVEthing.home.PROFILE.CHAR_COL_SPAN);

    this.html = null;

    if (typeof(data) != "undefined") {
        this.parseResponse(data);
    } else {
        this.load();
    }
};

EVEthing.home.CharacterDisplay.prototype.load = function() {
    // Pass
};

EVEthing.home.CharacterDisplay.prototype.animate = function(now) {
    var notifications = false;
    var errors = false;

    var total_sp = this.character.details.total_sp;
    var skill_queue_empty = true;

    if (this.character.hasOwnProperty('skill_queue')) {
        if (this.character.skill_queue.length > 0) {
            skill_queue_empty = false;

            while (this.character.skill_queue[0].end_time < now) {
                this.character.details.total_sp = this.character.details.total_sp + this.character.skill_queue[0].end_sp - this.character.skill_queue[0].start_sp;
                this.character.skill_queue.shift();

                total_sp = this.character.details.total_sp;

                this.render();
            }

            var training_time_left = this.character.skill_queue[0].end_time - Math.round(new Date().getTime() / 1000);
            var training_sp_left = training_time_left * (this.character.skill_queue[0].sp_per_minute / 60);

            //var req_sp = this.character.skill_queue[0].end_sp - this.character.skill_queue[0].start_sp;

            var start_sp = EVEthing.home.SP_PER_LEVEL[this.character.skill_queue[0].to_level - 1] * this.character.skill_queue[0].skill.rank;
            var end_sp =  EVEthing.home.SP_PER_LEVEL[this.character.skill_queue[0].to_level] * this.character.skill_queue[0].skill.rank;

            var req_sp = end_sp - start_sp;


            total_sp = Math.round(total_sp + (req_sp - training_sp_left));

            this.well.find('.total-sp').text(Handlebars.helpers.comma(total_sp) + ' SP');

            var complete_percent = (((req_sp - training_sp_left)/req_sp)*100);

            this.well.find('.progress .progress-bar').text(complete_percent.toFixed(1) + '%').css('width', complete_percent + '%');
            this.well.find('.skillduration').text(Handlebars.helpers.duration(training_time_left) + ' @ ' + Handlebars.helpers.comma(this.character.skill_queue[0].sp_per_hour) + ' SP/h');

            var total = training_time_left;
            for (var i=1; i<this.character.skill_queue.length; i++) {
                total += this.character.skill_queue[i].end_time - this.character.skill_queue[i].start_time;
            }

            this.well.find('.queueduration').text(Handlebars.helpers.shortduration(total));

            if (!this.character.config.home_suppress_low_skill_queue) {
                if (total < EVEthing.home.ONE_DAY) {
                    this.well.find('.progress').addClass('progress-danger');

                    this.well.find('.home-notifications .low-skill-queue').show();
                    this.well.find('.home-notifications .low-skill-queue span').text(Handlebars.helpers.shortduration(total));

                    errors = true;
                } else {
                    this.well.find('.progress').removeClass('progress-danger');

                    this.well.find('.home-notifications .low-skill-queue').hide();
                }
            }

            if (!this.character.config.home_suppress_implants) {
                if (this.character.details[this.character.skill_queue[0].skill.primary_attribute[1]] === 0 ||
                    this.character.details[this.character.skill_queue[0].skill.secondary_attribute[1]] === 0) {

                    // I should probably have a better way of getting the short skill names, but this works for
                    //  now and has the added benifit of not making me add more to the the api

                    var attr;
                    var text = '';
                    if (this.character.details[this.character.skill_queue[0].skill.primary_attribute[1]] === 0) {
                        attr = this.character.skill_queue[0].skill.primary_attribute[1].split('_')[0];
                        text = attr.charAt(0).toUpperCase() + attr.slice(1);
                    }
                    if (this.character.details[this.character.skill_queue[0].skill.secondary_attribute[1]] === 0) {
                        attr = this.character.skill_queue[0].skill.secondary_attribute[1].split('_')[0];
                        if (text !== '') text = text + ', ';
                        text = text + attr.charAt(0).toUpperCase() + attr.slice(1);
                    }
                    this.well.find('.home-notifications .implants span').text(text);

                    this.well.find('.home-notifications .implants').show();
                    notifications = true;
                } else {
                    this.well.find('.home-notifications .implants').hide();
                }
            }
        }
    }

    if (!this.character.config.home_suppress_empty_skill_queue) {
        if (skill_queue_empty) {
            this.well.find('.home-notifications .empty-skill-queue').show();
            errors = true;
        } else {
            this.well.find('.home-notifications .empty-skill-queue').hide();
        }
    }

    if (this.character.details.clone_skill_points < total_sp) {
        notifications = true;
        this.well.find('.home-notifications .clone').show();
        this.well.find('.home-notifications .clone span').text(Handlebars.helpers.comma(this.character.details.clone_skill_points));
    } else {
        this.well.find('.home-notifications .clone').hide();
    }

    if (this.character.apikey.expires) {
        if ((this.character.apikey.expires - now) < EVEthing.home.EXPIRE_WARNING) {
            this.well.find('.home-notifications .key-expiring').show();
        } else {
            this.well.find('.home-notifications .key-expiring').hide();
        }
    }

    var paid_diff = this.character.apikey.paid_until - now;
    if (paid_diff < 0) {
        if (!this.character.config.home_suppress_no_game_time) {
            errors = true;
            this.well.find('.home-notifications .no-game-time').show();
        }
    } else {
        this.well.find('.home-notifications .no-game-time').hide();

        if (paid_diff < EVEthing.home.EXPIRE_WARNING) {
            if (!this.character.config.home_suppress_low_game_time) {
                notifications = true;
                this.well.find('.home-notifications .low-game-time').show();
                this.well.find('.home-notifications .low-game-time span').text(Handlebars.helpers.shortduration(paid_diff));
            }
        } else {
            this.well.find('.home-notifications .low-game-time').hide();
        }
    }

    if (notifications || errors) {
        this.well.find('.home-notifications').show();
    } else {
        this.well.find('.home-notifications').hide();
    }

    this.well.find('.well').removeClass('background-error border-error');
    this.well.find('.well').removeClass('background-warn border-warn');
    this.well.find('.well').removeClass('background-success border-success');

    if (errors) {
        this.well.find('.well').addClass(EVEthing.home.ERROR_CSS_CLASS);
    } else {
        if (notifications) {
            this.well.find('.well').addClass(EVEthing.home.WARNING_CSS_CLASS);
        } else {
            this.well.find('.well').addClass(EVEthing.home.SUCCESS_CSS_CLASS);
        }
    }

    return {'total_sp': total_sp};
};

EVEthing.home.CharacterDisplay.prototype.parseResponse = function(data) {
    // The optional things are all at the first level of the character dict
    //  so just iterate over the first level and assign that
    for (var key in data.characters[this.character_id]) {
        if (!data.characters[this.character_id].hasOwnProperty(key)) continue;

        this.character[key] = data.characters[this.character_id][key];
    }

    // Round Security Status to two decimal places
    if (data.characters[this.character_id].hasOwnProperty('details')) {
        if (data.characters[this.character_id].details.security_status > 1 ||
            data.characters[this.character_id].details.security_status < -1) {
            
            data.characters[this.character_id].details.security_status = 
                parseFloat(data.characters[this.character_id].details.security_status).toPrecision(3);
        } else {
            data.characters[this.character_id].details.security_status = 
                parseFloat(data.characters[this.character_id].details.security_status).toPrecision(2);
        }            
    }

    if (data.characters[this.character_id].hasOwnProperty('skill_queue')) {
        for (var i=0; i<this.character.skill_queue.length; i++) {
            var pri = 0;
            pri += this.character.details[this.character.skill_queue[i].skill.primary_attribute[0]];
            pri += this.character.details[this.character.skill_queue[i].skill.primary_attribute[1]];

            var sec = 0;
            sec += this.character.details[this.character.skill_queue[i].skill.secondary_attribute[0]];
            sec += this.character.details[this.character.skill_queue[i].skill.secondary_attribute[1]];

            this.character.skill_queue[i].sp_per_minute = pri + (sec / 2);
            this.character.skill_queue[i].sp_per_hour = this.character.skill_queue[i].sp_per_minute * 60;

            // We don't really care about the milliseconds, and they were getting annoying in debugging
            this.character.skill_queue[i].end_time = Math.round(new Date(this.character.skill_queue[i].end_time + '+00:00').getTime() / 1000);
            this.character.skill_queue[i].start_time = Math.round(new Date(this.character.skill_queue[i].start_time + '+00:00').getTime() / 1000);
        }

        /*
         * Apparently I was wrong and this is not needed.
         */

        /* We need to take the amount of SP that is being trained on the current skill away, so that the animated updater
         * will be able to report back the correct total_sp. *//*
        var training_time_left = this.character.skill_queue[0].end_time - Math.round(new Date().getTime() / 1000);
        var training_sp_left = training_time_left * (this.character.skill_queue[0].sp_per_minute / 60);
        var training_sp_to_now = (this.character.skill_queue[0].end_sp - this.character.skill_queue[0].start_sp) - training_sp_left;
        
        this.character.details.total_sp = this.character.details.total_sp - training_sp_to_now;
        */
    }

    if (!this.character.hasOwnProperty('skill_queue_duration')) this.character.skill_queue_duration = 0;

    if (this.character.apikey.expires)
        this.character.apikey.expires= Math.round(new Date(this.character.apikey.expires + '+00:00').getTime() / 1000);
    if (this.character.apikey.paid_until)
        this.character.apikey.paid_until = Math.round(new Date(this.character.apikey.paid_until + '+00:00').getTime() / 1000);    

    if (data.hasOwnProperty('ships')) EVEthing.home.parseShips(data);
    if (data.hasOwnProperty('alliances')) EVEthing.home.parseAlliances(data);
    if (data.hasOwnProperty('corporations')) EVEthing.home.parseCorporations(data);
    if (data.hasOwnProperty('systems')) EVEthing.home.parseSystems(data);

    this.html = this.render();
};

EVEthing.home.CharacterDisplay.prototype.render = function() {
    this.html = $(EVEthing.home.CHARACTER_TEMPLATE({
            'character': this.character,
            'profile': EVEthing.home.PROFILE,
            'ships': EVEthing.home.SHIPS,
            'corporations': EVEthing.home.CORPORATIONS,
            'alliances': EVEthing.home.ALLIANCES
    }));

    this.html.find('[rel="popover"]').popover({'animation': false, 'trigger': 'hover', 'html': true});
    this.html.find('[rel="tooltip"]').tooltip({'animation': false, 'trigger': 'hover', 'html': true});

    this.well.empty();
    this.well.append(this.html);
};
}());
