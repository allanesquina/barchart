(function () {
    'use strict';

    var tooltip;
    var tDateEl;
    var tAmountEl;
    var currentYear = '2015';
    var monthNames = ['January', 'February', 'March', 'April', 'May',
        'June', 'July', 'August', 'September', 'October', 'November',
        'December'
    ];
    var margin = {
        top: 20,
        right: 20,
        bottom: 30,
        left: 40
    };
    var width = 960 - margin.left - margin.right;
    var height = 200 - margin.top - margin.bottom;
    var first = true;
    var marginRight = 0;
    var day31;
    var label;
    var days;

    function showTooltip(obj) {
        var date = new Date(obj.date);

        tooltip = tooltip || d3.select('#tooltip');
        tDateEl = tDateEl || tooltip.select('#t-date');
        tAmountEl = tAmountEl || tooltip.select('#t-amount');

        tooltip.attr('style', 'transform: translate(' + (d3.event.layerX -
            50) + 'px, 0)')
        tDateEl.text(date.toDateString().split(' ')[0] + ' ' + (date.getUTCMonth() +
            1) + '/' + date.getUTCDate());
        tAmountEl.text((obj.value / 100).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
        }));

        tooltip.attr('class', 'show');
    }

    function hideTooltip() {
        tooltip.attr('class', '');
    }

    function getMonth(month, months) {
        var i = 0;
        var found = false;
        var index = months.map(function (obj) {
            if (obj.month === month) {
                found = true;
                return i;
            }
            i += 1;
        });
        return found ? i : false;
    }

    // Normalizing data
    function normalizeData(data) {
        data = data.reduce(function (out, obj, i) {
            var old = obj;
            var obj = {
                date: obj.date.split('-'),
                am: obj.amount
            };
            var mon;
            var tmp = {};
            if (currentYear === obj.date[0]) {
                mon = getMonth(obj.date[1], out);
                if (!mon && mon !== 0) {
                    tmp.month = obj.date[1];
                    tmp['d_' + +obj.date[2]] = obj.am;
                    out.push(tmp);
                } else {
                    out[mon]['d_' + +obj.date[2]] = obj.am;
                }
            }
            return out;
        }, []);

        days = d3.keys(data[0]).filter(function (key) {
            return key !== 'month'
        });

        if (!('d_31' in days)) {
            days.push('d_31');
        }

        data.forEach(function (d) {
            d.days = days.map(function (name) {
                return {
                    name: name,
                    value: +d[name],
                    date: currentYear + '-' + d.month + '-' +
                        name.substr(2)
                }
            });
        });

        return data;
    }
    // Defining d3 scales
    var x0 = d3.scale.ordinal().rangeRoundBands([0, width], .1);
    var x1 = d3.scale.ordinal();
    var y = d3.scale.linear().range([height, 0]);

    // Creating a svg element
    var svg = d3.select('body').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top +
            ')');


    function render(data) {
        // Defining scales domains
        x0.domain(data.map(function (d) {
            return d.month;
        }));
        x1.domain(days).rangeRoundBands([0, x0.rangeBand()]);
        y.domain([0, d3.max(data, function (d) {
            return d3.max(d.days, function (d) {
                return d.value;
            });
        })]);

        // Creating month groups
        var month = svg.selectAll('.month')
            .data(data)
            .enter().append('g')
            .attr('class', 'month')
            .attr('transform', function (d) {
                marginRight = first ? 0 : marginRight + (day31 ? 42 :
                    50);
                first = false;
                day31 = ('d_31' in d);
                return 'translate(' + (x0(d.month) - marginRight) +
                    ',0)';
            })

        // Creating month's days
        month.selectAll('rect')
            .data(function (d) {
                return d.days;
            })
            .enter().append('rect')
            .attr('width', x1.rangeBand())
            .attr('class', 'bar')
            .attr('x', function (d) {
                return x1(d.name);
            })
            .attr('y', function (d) {
                return y(d.value);
            })
            .attr('height', function (d) {
                return height - y(d.value);
            })
            .on('mouseover', function (d) {
                showTooltip(d);
            })
            .on('mouseout', function (d) {
                hideTooltip();
            })

        // Creating labels (xaxis)
        month.append('g')
            .attr('width', x0.rangeBand())
            .attr('height', 50)
            .attr('id', 'label')
            .attr('transform', 'translate(5,' + (height + 15) + ')')
            .append('rect')
            .attr('width', x0.rangeBand())
            .attr('height', 2)
            .attr('class', 'label-border')
            .attr('transform', 'translate(0,-15)')

        label = month.select('#label');

        label.append('text')
            .text(function (d) {
                return monthNames[d.month - 1].toUpperCase();
            })
            .attr('class', 'label-text')
            .attr('transform', 'translate(15,3)')

        label.append('rect')
            .attr('width', 2)
            .attr('class', 'label-border')
            .attr('height', 20)
            .attr('transform', 'translate(0,-12)')
    }

    // init
    d3.json(
        'https://gist.githubusercontent.com/gaprl/2859ae8bee6c934fa6f2/raw/4c941829885c73141f4b1053f49190dd67f4303e/data.json',
        function (error, data) {
            if (error) {
                return;
            }
            render(normalizeData(data));
        });
}());
