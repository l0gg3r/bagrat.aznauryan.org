
var Year = function(parent, year, width, x) {
    this.months = {
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
        var localPosition = monthWidth * (this.months[month] - 1);

        return parseInt(this.div.style.left) + localPosition + this.width / 2;
    };

    this.getPeriodWidth = function(startMonth, endMonth, endYear) {
        var monthWidth = (this.width + this.parent.yearDelta) / 12;
        var months = (endYear - this.year) * 12 - this.months[startMonth] + this.months[endMonth];

        return months * monthWidth;
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

var Scenario = function(parent, scale, width, height) {
    this.parent = parent;
    this.scale = scale;
    this.width = width - 1;
    this.height = height;
    this.entries = {};

    var div = document.createElement('div');
    div.style.height = height;
    div.style.width = this.width;
    this.div = div;

    this.draw = function() {
        this.parent.appendChild(this.div);
        for (var k in this.entries) {
            console.log(k);
            this.div.appendChild(this.entries[k].div);
        }
    };

    this.addEntry = function (name, start, end) {
        var positionParams = this.scale.getPeriodInTime(start, end);

        var div = document.createElement('div');
        div.className = 'timelineEntry';
        div.style.height = this.height;
        div.style.width = positionParams.width;
        div.style.left = positionParams.x;
        div.innerHTML = name;

        this.entries[name] = {start: start, end: end, div: div};
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
            self.experience.addEntry(entry.name, entry.start, entry.end);
        });

        this.edu.forEach(function (entry) {
            self.education.addEntry(entry.name, entry.start, entry.end);
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

timeline.addEducation({name: 'Yerevan State University', start: {month: 'sep', year: 2008}, end: {month: 'jun', year: 2012}});
timeline.addEducation({name: 'American University of Armenia', start: {month: 'sep', year: 2012}, end: {month: 'jan', year: 2015}});

timeline.addExperience({name: 'Antel Design', start: {month: 'feb', year: 2010}, end: {month: 'jul', year: 2012}});
timeline.addExperience({name: 'be2', start: {month: 'jul', year: 2012}, end: {month: 'mar', year: 2013}});
timeline.addExperience({name: 'IUNetworks', start: {month: 'mar', year: 2013}, end: {month: 'nov', year: 2014}});
timeline.addExperience({name: 'Aarki', start: {month: 'nov', year: 2014}, end: {month: 'dec', year: 2015}});

function drawTimeline() {
    timeline.draw();
}

