$(document).ready (function () { 
    var globalResource = $("[name=resource]:first-child").val();
    var globalDateObj = new Date();
    var globalDaysArr = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var globalMonthsArr = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    //$("#curDate").text(globalDaysArr[globalDateObj.getDay()] + ", " + globalMonthsArr[globalDateObj.getMonth()] + " " + globalDateObj.getDate() + ", " + globalDateObj.getFullYear());
    $("#curDate").text("Currently Viewing: " + globalResource.toUpperCase());
    $("#curMonth").text(globalMonthsArr[globalDateObj.getMonth()] + " " + globalDateObj.getFullYear());
    
    $("#nextMonth").click(function() {
        globalDateObj.setMonth(globalDateObj.getMonth()+1);
        displayCalendarMonth(globalDateObj.getMonth(), globalDateObj.getFullYear(), globalResource);
        $("#curMonth").text(globalMonthsArr[globalDateObj.getMonth()] + " " + globalDateObj.getFullYear());
    });
    $("#prevMonth").click(function() {
        globalDateObj.setMonth(globalDateObj.getMonth()-1);
        displayCalendarMonth(globalDateObj.getMonth(), globalDateObj.getFullYear(), globalResource);
        $("#curMonth").text(globalMonthsArr[globalDateObj.getMonth()] + " " + globalDateObj.getFullYear());
    });
    
    displayCalendarMonth (globalDateObj.getMonth(), globalDateObj.getFullYear(), globalResource);
    hideAllHomePages();
    
    $("#welcome").css("border-bottom-color", "white");
    
    $("#calendarPage").show();
    
    $("#calendarButton").click(function() {
        hideAllHomePages();
        $("#calendarPage").show();
    });
    
    $("#myBookingsButton").click(function() {
        hideAllHomePages();
        $("#myBookingsPage").show();
    });
    
    $("#instructionsButton").click (function() {
        hideAllHomePages();
        $("#instructionsPage").show();
    });
    
    $("#resourceSelection").click (function () {
        globalResource = $("[name=resource]").val();
        displayCalendarMonth (globalDateObj.getMonth(), globalDateObj.getFullYear(), globalResource);
        $("#curDate").text("Currently Viewing: " + globalResource.toUpperCase());
    });
    
    $("#getPrinterFriendlyButton").click (function () {
        var printerFriendlyPage = window.open("", "Printer Friendly", "width=800,height=600,location=no,menubar=no,status=no,titlebar='Print',resizable=no,");
        //printerFriendlyPage.document.write("<p>This is 'MsgWindow'. I am 200px wide and 100px tall!</p>");
        var calendar = [], daysSoFar = 0, calendarTable = "";
        $("#calendar > div").each (function () {
            if (daysSoFar == 0) {
                calendar.push ("");
            }
            if ($(this).find('.period').length > 0) {
                calendar[calendar.length-1] += "<td style='width:180px;height:180px;border-style:solid;'>";
                calendar[calendar.length-1] += "<div style='width:100%;border-bottom-style:solid;'><strong>" + $(this).find('.calendarDayHeader').text() + "</strong></div>";
                $(this).find(".period").each (function () {
                    if ($(this).hasClass('unavailable')) {
                        calendar[calendar.length-1] += "<div style='width:100%;'><strong>" + $(this).text() + "</strong></div>";
                    } else {
                        calendar[calendar.length-1] += "<div style='width:100%;'>" + $(this).text() + "</div>";
                    }
                });
                calendar[calendar.length-1] += "</td>";
                daysSoFar++;
                daysSoFar %= 5;
            }
        });
        calendarTable += "<table style='width:100%'>";
        for (var calendarRow = 0; calendarRow < calendar.length; calendarRow++) {
            calendarTable += "<tr>" + calendar[calendarRow] + "</tr>";
        }
        calendarTable += "</table>";
        //console.log (calendarTable);
        printerFriendlyPage.document.write(calendarTable);
        /*novoForm.onload = function() {
          printerFriendlyPage.document.write("<p>This is 'MsgWindow'. I am 200px wide and 100px tall!</p>");
        };*/
    });
    
    $(document).on ('click', '.available', function () {
        var parsed = parsePeriodId ($(this).attr('id'));
        var periodId = "#" + $(this).attr('id');
        var userId = firebase.auth().currentUser.uid;
        //updatedData["users/" + userId + "/bookings/bookingsCount/count"] = 0;
        firebase.database().ref('users/' + userId + '/bookings/bookingsCount').once('value').then (function (snapshot) {
            if (snapshot.val()==null) {
                var updatedData = {};
                updatedData["users/" + userId + "/bookings/bookingsCount/count"] = 0;
                firebase.database().ref().update(updatedData, function (error) {
                    if (error) {
                        displayTempMessage (("Error updating data: " + error) , "#homePage");
                        console.log ("Error updating data: ", error);
                    } else {
                        makeBooking (parsed.month, parsed.date, parsed.year, parsed.year+"/"+parsed.month+"/"+parsed.date, parsed.period, globalResource, periodId);
                    }
                });
            } else {
                makeBooking (parsed.month, parsed.date, parsed.year, parsed.year+"/"+parsed.month+"/"+parsed.date, parsed.period, globalResource, periodId);
            }
        });
        //makeBooking (parsed.month, parsed.date, parsed.year, parsed.year+"/"+parsed.month+"/"+parsed.date, parsed.period, globalResource, periodId);
    });
    
    $(document).on ('click', '.unavailable', function () {
        var bookedByUserEmail = $(this).find('strong').attr('id');
        displayTempMessage ("Already booked by: " + bookedByUserEmail, "#calendarPage");
    });
    
    function makeBooking (MONTH, DATE, YEAR, FULLDATE, PERIOD, RESOURCE, ID) {
        var database = firebase.database();
        var userId = firebase.auth().currentUser.uid;
        var userEmail = firebase.auth().currentUser.email;
        var generatedKey = generateKey(10);
        firebase.database().ref('/users/' + userId + '/bookings/bookingsCount/count').once('value').then (function (snapshot) {
            var bookingsCount = snapshot.val();
            console.log (generatedKey);
            console.log(bookingsCount+1);
            var updatedData = {};
            updatedData["users/" + userId + "/bookings/bookingsCount"] = {
                count: bookingsCount+1
            };
            updatedData["users/" + userId + "/bookings/" + RESOURCE + "/" + generatedKey] = {
                month: MONTH,
                date: DATE,
                year: YEAR,
                fullDate: FULLDATE,
                period: PERIOD,
                resource: RESOURCE
            };
            console.log (userEmail);
            updatedData["allResources/" + RESOURCE + "/" + YEAR + "/" + MONTH + "/" + DATE + "/" + PERIOD] = {
                generatedKey: generatedKey,
                userEmail: userEmail
            };
            firebase.database().ref().update(updatedData, function (error) {
                if (error) {
                    displayTempMessage (("Error updating data: " + error) , "#homePage");
                    console.log ("Error updating data: ", error);
                } else {
                    var appendDiv;
                    if ($("#bookingsList > .booking").length % 2 == 1) {
                        appendDiv = '<div class="booking" style="background-color:#F8F8F8"><div class = "bookingDate">' + FULLDATE + '</div><div class = "bookingPeriod">' + PERIOD + '</div><div class = "bookingResource">' + RESOURCE + '</div><div class = "bookingCancel" id=' + generatedKey + ' onclick="void(0)">Delete</div></div>';
                    } else {
                        appendDiv = '<div class="booking"><div class = "bookingDate">' + FULLDATE + '</div><div class = "bookingPeriod">' + PERIOD + '</div><div class = "bookingResource">' + RESOURCE + '</div><div class = "bookingCancel" id=' + generatedKey + ' onclick="void(0)">Delete</div></div>';
                    }
                    $("#bookingsList").append(appendDiv);
                    displayBookingsCount();
                    $(ID).removeClass ('available');
                    $(ID).addClass ('unavailable');
                    $(ID).html("<strong>Period " + PERIOD + ": Booked</strong>");
                    $(ID).find('strong').attr('id', firebase.auth().currentUser.email);
                    displayTempMessage ("Booking made for " + FULLDATE + ", period " + PERIOD, "#calendarPage");
                }
            });
        });
    }
    
    function readUserBookings () {
        var userId = firebase.auth().currentUser.uid;
        var resources = ["cafeteria", "computerLab", "netbookCart", "theatre"];
        for (var currentResource = 0; currentResource < resources.length; currentResource++) {
            firebase.database().ref('users/' + userId + '/bookings/' + resources[currentResource]).once('value').then (function (snapshot) {
                snapshot.forEach (function (childSnapshot) {
                    var fullDate = childSnapshot.val().fullDate;
                    var period = childSnapshot.val().period;
                    var resource = childSnapshot.val().resource;
                    var id = childSnapshot.key;
                    var appendDiv;
                    if ($("#bookingsList > .booking").length % 2 == 1) {
                        appendDiv = '<div class="booking" style="background-color:#F8F8F8"><div class = "bookingDate">' + fullDate + '</div><div class = "bookingPeriod">' + period + '</div><div class = "bookingResource">' + resource + '</div><div class = "bookingCancel" id=' + id + ' onclick="void(0)">Delete</div></div>';
                    } else {
                        appendDiv = '<div class="booking"><div class = "bookingDate">' + fullDate + '</div><div class = "bookingPeriod">' + period + '</div><div class = "bookingResource">' + resource + '</div><div class = "bookingCancel" id=' + id + ' onclick="void(0)">Delete</div></div>';
                    }
                    //var appendDiv = '<div class="booking"><div class = "bookingDate">' + fullDate + '</div><div class = "bookingPeriod">' + period + '</div><div class = "bookingResource">' + resource + '</div><div class = "bookingCancel" id=' + id + '>Delete</div></div>';
                    $("#bookingsList").append(appendDiv);
                    displayBookingsCount();
                });
            });
        }
    }
    
    $(document).on('click', '.bookingCancel', function () {
        if ($(this).attr('id') == "bookingCancelHeader") {
            return;
        }
        var userId = firebase.auth().currentUser.uid;
        var fullDate = $(this).parent().find(".bookingDate").text();
        var period = $(this).parent().find(".bookingPeriod").text();
        var resource = $(this).parent().find(".bookingResource").text();
        var id = $(this).attr('id');
        console.log (fullDate + " " + period + " " + resource + " " + id);
        //firebase.database().ref('/users/' + userId + "/bookings/" + resource + "/" + id).remove();
        firebase.database().ref('/users/' + userId + '/bookings/bookingsCount/count').once('value').then (function (snapshot) {
            var bookingsCount = snapshot.val();
            console.log (id);
            console.log(bookingsCount-1);
            var updatedData = {};
            updatedData["users/" + userId + "/bookings/bookingsCount"] = {
                count: bookingsCount-1
            };
            updatedData["users/" + userId + "/bookings/" + resource + "/" + id] = null;
            var YEAR = fullDate.substring(0,4);
            var MONTH = fullDate.substring(5,7);
            var DATE = fullDate.substring(8,10);
            updatedData["allResources/" + resource + "/" + YEAR + "/" + MONTH + "/" + DATE + "/" + period] = null;
            firebase.database().ref().update(updatedData, function (error) {
                if (error) {
                    displayTempMessage (("Error updating data: " + error) , "#homePage");
                    console.log ("Error updating data: ", error);
                } else {
                    $("#bookingsList").find("#" + id).parent().remove();
                    ID = "#id-" + YEAR + "-" + MONTH + "-" + DATE + "-" + period;
                    $(ID).addClass ('available');
                    $(ID).removeClass ('unavailable');
                    $(ID).html("Period " + period + ": Available");
                    displayBookingsCount();
                    displayTempMessage ("Booking successfully deleted for " + fullDate, "#myBookingsPage");
                }
            });
        });
    });
    
    function displayBookingsCount () {
        $("#bookingsCount").text("Total Bookings: " + $("#bookingsList > .booking").length + "/15");
    }
    
    function displayCalendarMonth (month, year, resource) {
        $("#calendar").empty();
        var days = getDaysInMonth (month, year);
        for (var day = 0; day < days.length; day++) {
            var header = globalDaysArr[days[day].getDay()] + " " + days[day].getDate();
            var fullDate = "";
            fullDate += year + "-";
            if (days[day].getMonth()+1 <= 9) {
                fullDate += "0" + (days[day].getMonth()+1) + "-";
            } else {
                fullDate += (days[day].getMonth()+1) + "-";
            }
            if (days[day].getDate() <= 9) {
                fullDate += "0" + days[day].getDate();
            } else {
                fullDate += days[day].getDate();
            }
            if (days[day].getDay() == 0 || days[day].getDay() == 6) {
                $("#calendar").append ("<div class = 'calendarDay'><div class = 'calendarDayHeader' style='background-color:#eccc68'>" + header + "</div></div>");
            } else {
                var availability = "";
                
                for (var period = 1; period <= 5; period++) {
                    var available = true;
                    var message = "Period " + period + ": ";
                    var id = "id-" + fullDate + "-" + period;
                    /*if (Math.floor(Math.random() * (3 - 0 + 1)) + 0 == 0) {
                        //testing, set some days as booked randomly (1/4 chance), min = 0, max = 3;
                        available = false;
                    }*/
                    if (available) {
                        message += "Available";
                        availability += "<div class = 'available period' id = " + id + " onclick='void(0)'>" + message + "</div>";
                    } else {
                        message += "Booked";
                        availability += "<div class = 'unavailable period' id = " + id + " onclick='void(0)'><strong>" + message + "</strong></div>";
                    }
                    var parsed = parsePeriodId (id);
                    var periodId = "#" + id;
                    readDateBookings(parsed.month, parsed.date, parsed.year, parsed.period, resource, periodId);
                }
                $("#calendar").append ("<div class = 'calendarDay'><div class = 'calendarDayHeader'>" + header + "</div>" + availability + "</div>");
            }
        }
    }
    
    function readDateBookings (MONTH, DATE, YEAR, PERIOD, RESOURCE, ID) {
        firebase.database().ref('allResources/' + RESOURCE + '/' + YEAR + '/' + MONTH + '/' + DATE + '/' + PERIOD).once('value').then (function (snapshot) {
            if (snapshot.exists()) {
                $(ID).removeClass ('available');
                $(ID).addClass ('unavailable');
                $(ID).html("<strong id = " + snapshot.val().userEmail + ">Period " + PERIOD + ": Booked</strong>");
            }
        });
    }
    
    function parsePeriodId (id) {
        return {
            year: id.substring (3, 7),
            month: id.substring (8, 10),
            date: id.substring (11, 13),
            period: parseInt(id.substring (14, 16))
        };
    }
    
    $("#homePage").hide();
    
    $("#loginButton").click(function() {
        login();
    });
    
    function login () {
        var userEmail = $("#loginEmail").val();
        var userPass = $("#loginPass").val();
        firebase.auth().signInWithEmailAndPassword(userEmail, userPass).catch(function(error) {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          displayTempMessage(("Error logging in:" + errorMessage), "#signUpInPage");
        });
    }
    
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
          $("#homePage").show();
          $("#signUpInPage").hide();
          $("#welcome").html("Welcome, " + "<strong>" +  user.email + "</strong>");
          readUserBookings();
          displayTempMessage ("Welcome, " + user.email, "#homePage");
          $("#signUpInMenu").hide();
          $("#logoutMenu").show();
      } else {
        // No user is signed in.
          $("#homePage").hide();
          $("#signUpInPage").show();
          $("#welcome").html("Welcome");
          $("#bookingsList").empty();
          $("#signUpInMenu").show();
          $("#logoutMenu").hide();
      }
    });
    
    $("#logoutMenu").click(function () {
        firebase.auth().signOut().then(function() {
            // Sign-out successful.
            displayTempMessage("Successfully signed out.", "#signUpInPage");
        }) .catch(function(error) {
            // An error happened
            displayTempMessage("Error logging out: " + error.message, "#signUpInPage");            
        });
    });
    
    $(".homeOptions").click (function () {
        $(".homeOptions").css("border-bottom-color", "#74b9ff");
        $(this).css("border-bottom-color", "white");
    });
    
    function hideAllHomePages () {
        $("#calendarPage").hide();
        $("#myBookingsPage").hide();
        $("#instructionsPage").hide();
    }
    
    $("#menu > ul > li > a").click(function() {
        resetMenu();
        $(this).css("border-bottom-color", "white");
    });
    
    function resetMenu () {
        $("#menu > ul > li > a").css("border-bottom-color", "rgba(0,0,0,0)");
    }
    
    function displayTempMessage (message, pageId) {
        $(".tempMessage").remove();
        var id = generateKey(12);
        $(pageId).append($('<div class="tempMessage" id = ' + id + '>' + message + '</div>').hide().fadeIn(1000));
        setTimeout(function(){
            $("#" + id).remove();
        }, 8000);
    }
    
    function generateKey (len) {
        var keys = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXZY", genKey = "";
        for (var letter = 0; letter < len; letter++) {
            genKey += keys[Math.floor(Math.random() * (keys.length-1 + 1))];
        }
        return genKey;
    }
    
   /**
     * @param {int} The month number, 0 based
     * @param {int} The year, not zero based, required to account for leap years
     * @return {Date[]} List with date objects for each day of the month
     */
    function getDaysInMonth(month, year) {
         var date = new Date(year, month, 1);
         var days = [];
         while (date.getMonth() === month) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
         }
         return days;
    }
    
});

/*
5 resources * 20 days * 5 periods = 25*20 = 500 bookings per month max
*/