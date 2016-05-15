// Author: Stephen Yang (syang0)

////////////////////////
//// Data Gathering ////
////////////////////////

// Data sources
// US GDP: https://www.quandl.com/data/BEA/GDP-Current-Dollar-and-Real-Gross-Domestic-Product
// US Debt: https://www.quandl.com/data/TREASURY_DIRECT/USDEBT-U-S-Debt-History
// US Population: https://www.quandl.com/data/MWORTH/0_3-United-States-Population

// China GDP: https://www.quandl.com/data/NBSC/A020102_A-Gross-Domestic-Product
// China Debt: https://www.quandl.com/data/UGID/IFDBT_CHN-External-Debt-China
// China Population: https://www.quandl.com/data/MWORTH/6_2-China-Population

var us_units = 1000000000; // billions usd per unit
var us_data = [
    ["Date","GDP in billions of current dollars","GDP in billions of chained 2009 dollars"],["2015-12-31",17947.0,16348.9],["2014-12-31",17348.1,15961.7],["2013-12-31",16663.2,15583.3],["2012-12-31",16155.3,15354.6],["2011-12-31",15517.9,15020.6],["2010-12-31",14964.4,14783.8],["2009-12-31",14418.7,14418.7],["2008-12-31",14718.6,14830.4],["2007-12-31",14477.6,14873.7],["2006-12-31",13855.9,14613.8],["2005-12-31",13093.7,14234.2],["2004-12-31",12274.9,13773.5],["2003-12-31",11510.7,13271.1],["2002-12-31",10977.5,12908.8],["2001-12-31",10621.8,12682.2],["2000-12-31",10284.8,12559.7],["1999-12-31",9660.6,12065.9],["1998-12-31",9089.2,11525.9],["1997-12-31",8608.5,11034.9],["1996-12-31",8100.2,10561.0],["1995-12-31",7664.1,10174.8],["1994-12-31",7308.8,9905.4],["1993-12-31",6878.7,9521.0],["1992-12-31",6539.3,9266.6],["1991-12-31",6174.0,8948.4],["1990-12-31",5979.6,8955.0],["1989-12-31",5657.7,8786.4],["1988-12-31",5252.6,8474.5],["1987-12-31",4870.2,8132.6],["1986-12-31",4590.2,7860.5],["1985-12-31",4346.7,7593.8],["1984-12-31",4040.7,7285.0],["1983-12-31",3638.1,6792.0],["1982-12-31",3345.0,6491.3],["1981-12-31",3211.0,6617.7],["1980-12-31",2862.5,6450.4],["1979-12-31",2632.1,6466.2],["1978-12-31",2356.6,6267.2],["1977-12-31",2086.0,5937.0],["1976-12-31",1877.6,5675.4],["1975-12-31",1688.9,5385.4],["1974-12-31",1548.8,5396.0],["1973-12-31",1428.5,5424.1],["1972-12-31",1282.4,5134.3],["1971-12-31",1167.8,4877.6],["1970-12-31",1075.9,4722.0],["1969-12-31",1019.9,4712.5],["1968-12-31",942.5,4569.0],["1967-12-31",861.7,4355.2],["1966-12-31",815.0,4238.9],["1965-12-31",743.7,3976.7],["1964-12-31",685.8,3734.0],["1963-12-31",638.6,3530.4],["1962-12-31",605.1,3383.1],["1961-12-31",563.3,3188.1],["1960-12-31",543.3,3108.7],["1959-12-31",522.5,3031.0],["1958-12-31",482.0,2835.3],["1957-12-31",474.9,2856.3],["1956-12-31",450.1,2797.4],["1955-12-31",426.2,2739.0],["1954-12-31",391.1,2556.9],["1953-12-31",389.7,2571.4],["1952-12-31",367.7,2456.1],["1951-12-31",347.3,2360.0],["1950-12-31",300.2,2184.0],["1949-12-31",272.8,2008.9],["1948-12-31",274.8,2020.0],["1947-12-31",249.9,1939.4],["1946-12-31",227.8,1960.9],["1945-12-31",228.2,2217.8],["1944-12-31",224.6,2239.4],["1943-12-31",203.1,2073.7],["1942-12-31",166.0,1771.8],["1941-12-31",129.4,1490.3],["1940-12-31",102.9,1266.1],["1939-12-31",93.5,1163.6],["1938-12-31",87.4,1077.7],["1937-12-31",93.0,1114.6],["1936-12-31",84.9,1060.5],["1935-12-31",74.3,939.0],["1934-12-31",66.8,862.2],["1933-12-31",57.2,778.3],["1932-12-31",59.5,788.2],["1931-12-31",77.4,904.8],["1930-12-31",92.2,966.7],["1929-12-31",104.6,1056.6]
];


var yaun_to_USD = 0.15;
var china_units = 100000000; // 100 million yuan per unit
var china_data = [
    ["Date","Value"],["2014-12-31",635910.0],["2013-12-31",588018.75587184],["2012-12-31",534123.03892539],["2011-12-31",484123.50320182],["2010-12-31",408902.95166354],["2009-12-31",345629.22735096],["2008-12-31",316751.74853385],["2007-12-31",268019.35395799],["2006-12-31",217656.58543627],["2005-12-31",185895.76054586],["2004-12-31",160714.42018111],["2003-12-31",136564.64408539],["2002-12-31",121002.04356954],["2001-12-31",110270.35932862],["2000-12-31",99776.251327181],["1999-12-31",90187.738699047],["1998-12-31",84883.69402175],["1997-12-31",79429.475036594],["1996-12-31",71572.322333946],["1995-12-31",61129.795851046],["1994-12-31",48459.636871575],["1993-12-31",35524.347564023],["1992-12-31",27068.322866685],["1991-12-31",21895.530068488],["1990-12-31",18774.32076519],["1989-12-31",17090.32641684],["1988-12-31",15101.070608065],["1987-12-31",12102.175147367],["1986-12-31",10308.760962135],["1985-12-31",9039.9471338179],["1984-12-31",7226.2624333384],["1983-12-31",5975.5947452525],["1982-12-31",5333.0492753501],["1981-12-31",4898.147785429],["1980-12-31",4551.5822164],["1979-12-31",4067.6701330184],["1978-12-31",3650.1685118164]
];

// First convert China's Yuan to the same units as us (billions of USD)
for (var i = 1; i < china_data.length; ++i) {
    china_data[i][1] *= (yaun_to_USD*china_units/us_units);
}

////////////////////////
//// Data Massaging ////
////////////////////////

// Combine the two pieces of data into both row and column format (not sure which to use yet).
var rows = [["Date", "USA", "China"]];
var columns = [["Date"], ["USA"], ["China"]];
var dates = columns[0];
var usa = columns[1];
var china = columns[2];

// The two datasets appear sorted, so I can just merge sort the two based on time
var i = 1, j = 1;
while (i < us_data.length || j < china_data.length) {
    if (i == us_data.length) {
        rows.push([china_data[j][0], null, china_data[j][1]]);
        dates.push(china_data[j][0]);
        usa.push(null);
        china.push(china_data[j][1]);
        j++;
    } else if (j == china_data.length) {
        rows.push([us_data[i][0], us_data[i][1], null]);
        dates.push(us_data[i][0]);
        usa.push(us_data[i][1]);
        china.push(null);
        i++;
    } else {
        var us_date = Date.parse(us_data[i][0]);
        var china_date = Date.parse(china_data[j][0]);

        if (us_date == china_date) {
            // Merge
            rows.push([us_data[i][0], us_data[i][1], china_data[j][1]]);
            dates.push(us_data[i][0]);
            usa.push(us_data[i][1]);
            china.push(china_data[j][1]);
            i++;
            j++
        } else if (us_date > china_date) {
            rows.push([us_data[i][0], us_data[i][1], null]);
            dates.push(us_data[i][0]);
            usa.push(us_data[i][1]);
            china.push(null);
            i++
        } else {
            rows.push([china_data[j][0], null, china_data[j][1]]);
            dates.push(china_data[j][0]);
            usa.push(null);
            china.push(china_data[j][1]);
            ++j;
        }
    }
}

var chinasNewestDate = china_data[1][0];
var usNewestDate = us_data[1][0];
var chinasOldestDate = china_data[china_data.length - 1][0];
var usOldestDate = us_data[us_data.length - 1][0];

////////////////////////
//// Initial Graph /////
////////////////////////

var chartParms = {
    "bindto": "#theChartArea",  // I renamed it because it was in the tutorial...
    "data": {
        "x": 'Date',
        "columns": [
            dates,
            china
        ],
        "selection": {
            "enabled": true
        }
    },
    "grid": {
        "x": {
            "show": true
        },
        "y": {
            "show": true
        }
    },
    "axis": {
        "x": {
            "type": 'timeseries',
            "tick": {
                "format": '%Y',
                "fit": false
            },
            "min": chinasOldestDate
        },
        "y": {
            "label": "Billions (USD)"
        }
    },
    "tooltip": {
        "show": true,
        "grouped": true,
        "format": {
            value: function (value, ratio, id) {
                return "$" + parseFloat(value).toFixed(3);
            }
        }
    }
};

var chart = c3.generate(chartParms);


////////////////////////
//////// Slides ////////
////////////////////////
var slides = [];
function setMsg(s) {
    document.getElementById("message").innerHTML = s;
}

slides.push(function () {
    chart = c3.generate(chartParms);
    setMsg("Let's look at China's GDP.");
});

slides.push(function () {
    setMsg("Wow, their GDP is about ~9.5 Trillion USD! That's a lot of money!");
    chart.select(["China"], [85]);
});

slides.push(function () {
    setMsg("Here it is compared to the USA.");

    chart.load({
        "columns" : [dates, usa]
    })
});

slides.push(function () {
    setMsg("I guess it's no longer as impressive.");

    chart.unselect();
});

slides.push(function () {
    setMsg("The USA also has more data.");
    chart.axis.min({
        "x":usOldestDate
    });
});

slides.push(function() {
    setMsg("I guess China didn't really care about the GDP back then...");
    chart.regions.add({
        "start":usOldestDate,
        "end":chinasOldestDate
    });
});

slides.push(function() {
    setMsg("The source I used for USA also has more recent data");
    chart.regions.add({
        "start":chinasNewestDate,
        "end":usNewestDate
    });
});

slides.push(function() {
    setMsg("But that's okay, let's just focus on the recent past.");
    chart.axis.min({
        "x": dates[15]
    });

    chart.regions([]);
});

slides.push(function() {
    setMsg("Here it is as a bar chart.");
    chart.transform("bar");
});

slides.push(function() {
    setMsg("You can see how fast the gap is closing between the two!");

    // Compute the diffs and load them
    var newDates = dates.slice(0,15);
    var newDiff = ["Diff", null];
    for (var i = 2; i < 15; ++i) {
        newDiff.push(usa[i] - china[i]);
    }

    chart.flow({
        columns: [
            newDates,
            newDiff
        ]
    });
});

slides.push(function() {
    setMsg("Welp, that's all I have to say. China is catching up.");
});


///////////////////////////////
//// Boiler Plate Controls ////
///////////////////////////////
var current_slide = 0;
var run = function() {
    slides[current_slide]();
    current_slide += 1;

    if (current_slide === 1) {
        document.getElementById("start_btn").innerHTML = "Start";
    } else if (current_slide === slides.length) {
        current_slide = 0;
        document.getElementById("start_btn").innerHTML = "Replay";
    } else {
        document.getElementById("start_btn").innerHTML = "Continue";
    }
};

// button event handler
document.getElementById('start_btn').addEventListener("click", run);

// init
run();
