
months = {
    "jan": 1,
    "feb": 2,
    "mar": 3,
    "apr": 4,
    "may": 5,
    "jun": 6,
    "jul": 7,
    "aug": 8,
    "sep": 9,
    "oct": 10,
    "nov": 11,
    "dec": 12
};

var Year = function(parent, year, width, x) {
    this.parent = parent;
    this.year = year;
    this.width = width;
    this.fontSize = parent.height / 3;

    this.newScaleBar = function (top) {
        var barDiv = document.createElement('div');
        barDiv.className = 'scaleBar';
        if (top) {
            barDiv.style.top = 0;
        } else {
            barDiv.style.bottom = 0;
        }
        barDiv.style.height = (this.parent.height - this.fontSize) / 2 - (this.parent.height / 10);
        barDiv.style.left = width / 2;

        return barDiv
    };

    var numberDiv = document.createElement('div');
    numberDiv.style.position = 'absolute';
    numberDiv.style.textAlign = 'center';
    numberDiv.style.width = this.width;
    numberDiv.style.fontSize = this.fontSize;
    numberDiv.innerHTML = this.year;
    numberDiv.style.top = (parent.height / 2) - (this.fontSize / 2);
    this.numberDiv = numberDiv;

    this.topBar = this.newScaleBar(true);
    this.bottomBar = this.newScaleBar(false);

    var div = document.createElement('div');
    div.className = 'timelineYear';
    div.appendChild(this.topBar);
    div.appendChild(this.numberDiv);
    div.appendChild(this.bottomBar);
    div.style.left = x;

    this.div = div;

    this.draw = function () {
        this.parent.appendChild(this.div);
    };

    this.getMonthX = function (month) {
        var monthWidth = (this.width + this.parent.yearDelta) / 12;
        var localPosition = monthWidth * (months[month] - 1);

        return parseInt(this.div.style.left) + localPosition + this.width / 2;
    };

    this.getPeriodWidth = function(startMonth, endMonth, endYear) {
        var monthWidth = (this.width + this.parent.yearDelta) / 12;
        var monthsCount = (endYear - this.year) * 12 - months[startMonth] + months[endMonth];

        return monthsCount * monthWidth;
    };
};

var Scale = function(parent, start, end, height) {
    this.start = start;
    this.end = end;
    this.parent = parent;
    this.height = height - 2;
    this.years = [];
    this.yearMap = {};
    this.yearDelta = 50;

    var range = end - start + 1;

    var yearWidth = 40;
    this.width = (yearWidth + this.yearDelta) * range - this.yearDelta;
    for (var i = this.start; i <= this.end; ++i) {
        var year = new Year(this, i, yearWidth, (i - this.start) * (this.yearDelta + yearWidth));
        this.yearMap[i] = year;
        this.years.push(year);
    }

    var div = document.createElement('div');
    div.className = 'timelineScale';
    div.style.width = this.width;
    div.style.height = this.height;

    this.div = div;

    this.draw = function () {
        this.parent.appendChild(this.div);
        this.years.forEach(function (year) {
            year.draw();
        });
    };

    this.appendChild = function (child) {
        this.div.appendChild(child);
    };

    this.getPointInTime = function(month, year) {
        return this.yearMap[year].getMonthX(month);
    };

    this.getPeriodInTime = function(start, end) {
        var x = this.getPointInTime(start.month, start.year);
        var width = this.yearMap[start.year].getPeriodWidth(start.month, end.month, end.year);

        return {x: x, width: width};
    }
};

var ToolTip = function (parent, text, x) {
    this.parent = parent;
    this.text = text;
    this.x = x;

    var div = document.createElement('div');
    div.className = 'timelineEntryToolTip';
    div.style.left = x;
    div.innerHTML = this.text;
    this.div = div;

    this.draw = function() {
        document.body.appendChild(this.div);
    }
};

var ScenarioEntry = function (parent, scale, height, name, description, longDescription, start, end) {
    var positionParams = scale.getPeriodInTime(start, end);

    var div = document.createElement('div');
    div.className = 'timelineEntry';
    div.style.height = height;
    div.style.width = positionParams.width;
    div.style.left = positionParams.x;

    var contentDiv = document.createElement('div');
    var nameDiv = document.createElement('div');
    var descriptionDiv = document.createElement('div');

    nameDiv.innerHTML = name;
    nameDiv.className = 'timelineEntryName';

    descriptionDiv.innerHTML = description;
    descriptionDiv.className = 'timelineEntryDescription';
    descriptionDiv.style.right = positionParams.width / 40;

    this.tip = new ToolTip(parent.div, longDescription, positionParams.x);
    this.tip.draw();

    contentDiv.appendChild(nameDiv);
    contentDiv.appendChild(descriptionDiv);
    div.appendChild(contentDiv);

    var self = this;
    this.cbMouseover = function(value) {
        self.tip.div.style.visibility = 'visible';
    };

    this.cbMouseout = function(value) {
        self.tip.div.style.visibility = 'hidden';
    };

    this.cbMousemove = function(e) {
        self.tip.div.style.top = e.clientY - 20;
        self.tip.div.style.left = e.clientX + 20;
    };

    div.onmouseover = this.cbMouseover;
    div.onmouseout = this.cbMouseout;
    div.onmousemove = this.cbMousemove;

    this.div = div
};

var Scenario = function(parent, scale, width, height) {
    this.parent = parent;
    this.scale = scale;
    this.width = width - 1;
    this.height = height;
    this.entries = [];

    var div = document.createElement('div');
    div.style.height = height;
    div.style.width = this.width;
    this.div = div;

    this.draw = function() {
        this.parent.appendChild(this.div);
        var self = this;
        this.entries.forEach(function (entry) {
            self.div.appendChild(entry.div);
        });
    };

    this.addEntry = function (name, url, description, longDescription, start, end) {
        name = '<a href="' + url + '" target="_blank">' + name + "</a>";
        this.entries.push(new ScenarioEntry(this, this.scale, this.height, name, description, longDescription, start, end));
    }
};

var Timeline = function(height) {
    this.height = height;
    this.minYear = 9999;
    this.maxYear = 0;
    this.exp = [];
    this.edu = [];

    this.init = function(start, end) {
        var main = document.getElementById('timeline');

        var scale = new Scale(main, start, end, height / 3);

        main.style.width = scale.width;
        main.style.height = this.height;

        this.scale = scale;
        this.experience = new Scenario(main, scale, scale.width, height / 3);
        this.education = new Scenario(main, scale, scale.width, height / 3);
    };

    this.draw = function () {
        this.init(this.minYear, this.maxYear + 1);

        var self = this;
        this.exp.forEach(function (entry) {
            self.experience.addEntry(entry.name, entry.url, entry.description, entry.longDescription, entry.start, entry.end);
        });

        this.edu.forEach(function (entry) {
            self.education.addEntry(entry.name, entry.url, entry.description, entry.longDescription, entry.start, entry.end);
        });

        this.experience.draw();
        this.scale.draw();
        this.education.draw();
    };

    this.refineRange = function (entry) {
        if (entry.start.year < this.minYear) {
            this.minYear = entry.start.year;
        }
        if (entry.end.year > this.maxYear) {
            this.maxYear = entry.end.year;
        }
    };

    this.addExperience = function (entry) {
        this.exp.push(entry);
        this.refineRange(entry);
    };

    this.addEducation = function (entry) {
        this.edu.push(entry);
        this.refineRange(entry);
    }
};

var timeline = new Timeline(90);

timeline.addEducation({
    name: 'Yerevan State University',
    url: 'http://ysu.am/faculties/en/Physics',
    description: 'B.S. in Physics',
    longDescription: 'Designed and implemented a device for automated investigation of the relation between the temperature and opacity of nematic liquid crystals.',
    start: {month: 'sep', year: 2008},
    end: {month: 'jun', year: 2012}
});
timeline.addEducation({
    name: 'American University of Armenia',
    url: 'http://cse.aua.am',
    description: 'M.S. in Computer Science',
    longDescription: 'Designed an extensible programmable motion control gimbal based on Raspberry Pi and Atmel AVR microcontroller.',
    start: {month: 'sep', year: 2012},
    end: {month: 'jan', year: 2015}
});

timeline.addExperience({
    name: 'Antel Design',
    url: 'http://www.knightsbridgeglobal.eu/index.php?option=com_content&view=article&id=3&Itemid=1&lang=en',
    description: 'C, AVR32',
    longDescription: 'Developed a command line interface via RS232 using C language on AVR32 architecture for a proprietary wireless transceiver. Also, wrote a GUI front-end application, by which increased user experience for configuring and monitoring the device. Additionally,integrated a third party Wi-Fi module on same platform to enable remote wireless configuration of the radio. Wrote technical specifications and documentations for each piece of software.',
    start: {month: 'feb', year: 2010},
    end: {month: 'jul', year: 2012}
});
timeline.addExperience({
    name: 'be2',
    url: 'http://www.be2.com',
    description: 'Java',
    longDescription: 'Developed RESTful Web Services for a matchmaking web application. Improved software development processes by setting up development environments and writing automation scripts, which increased development productivity by about 7% daily. Covered the developed code with unit tests and documentation which increased the readability of the code and decreased build fails. Worked as a part of a Scrum team, and investigated Scrum philosophy and principles.',
    start: {month: 'jul', year: 2012},
    end: {month: 'mar', year: 2013}
});
timeline.addExperience({
    name: 'IUNetworks',
    url: 'http://iunetworks.am/#aboutUS',
    description: 'Java, Python, bash',
    longDescription: 'Designed 3-tier architecture for an e-commerce web service using Java. Developed scripts and organised infrastructure for automated builds, testing and code quality checks, which increased software quality and release processes and decreased development time. Developed base classes for unit testing which increased test coding by initialising and providing all necessary resources. Implemented logic split into service and data access layers.',
    start: {month: 'mar', year: 2013},
    end: {month: 'nov', year: 2014}
});
timeline.addExperience({
    name: 'Aarki',
    url: 'http://www.aarki.com/about/',
    description: 'Python',
    longDescription: 'Design distributed web services and business models, organise infrastructure, including build, test and deployment automation, database design and architecture. Organised and automated data-center security setup scripts which significantly decreased intrusion chances by leaving a single entry point to each data-center. Developed wrappers/decorators for Python to hide repeating and routine implementation tasks, which increased development and debugging time by providing more intuitive and clean code.',
    start: {month: 'nov', year: 2014},
    end: {month: getCurrentMonth(), year: 2015}
});

function getCurrentMonth() {
    var now = new Date();
    var thisMonth = now.getMonth() < 12 ? now.getMonth() + 1 : now.getMonth();

    for (var k in months) {
        if (months[k] == thisMonth) {
            return k;
        }
    }
}

function drawTimeline() {
    timeline.draw();
}

