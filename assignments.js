// TODO: when a new class is added, update the dropdown
// TODO: also, when classes are visible, typing c focuses first input
// TODO: use keydown instead of kep up (arrow keys)
// TODO: fix otherscccccfxfd... whatever class to be just "other"
// TODO: escaping out of edit should focus previous element
// TODO: implement undo/redo
// TODO: setting the date for next month doesn't show days due
// TODO: update across tabs
// TODO: multi-tabbed view
// TODO: fix bug when typing up/down scrolls view by default
// TODO: rearrange classes

const ASSIGNMENTS_KEY = "AssignmentManager_data"
      DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
var data = {};
// {classes: [ {id: 0, name: ""} ],
//  assignments: [ {id: 0, class: 0, name: "",
//                  hidden: false, due: {m: 0, d: 0}} ]}

$(function() {
    data = loadData();

    if (data.assignments) {
        buildTable(data);
    } else {
        $(".noAssignments").removeClass("invisible");
    }

    $(".buttonNew").click(pressButton);
    $(document).keyup(pressKey);
});

function buildTable() {
    // purge the table
    $("#content tr:not(.persistant)").remove();

    var sorted = data.assignments.sort(function(a, b) {
        if (a.due.m < b.due.m) return -1;
        if (a.due.m > b.due.m) return 1;
        if (a.due.d < b.due.d) return -1;
        if (a.due.d > b.due.d) return 1;
        if (a.class < b.class) return -1;
        if (a.class > b.class) return 1;
        return a.name.toLocaleLowerCase().localeCompare(
            b.name.toLocaleLowerCase());
    });

    for (var i = 0; i < sorted.length; i++) {
        addAssignment(sorted[i]);
    }

    // No assignments (which is a good thing ^-^)
    if (i === 0) {
        $(".noAssignments").removeClass("invisible");
    }
}

function addAssignment(assignment) {
    var template = $("#templateAssignment").get(0).cloneNode(true);
    template.id = assignment.id;
    var $temp = $(template);
    $temp.removeClass("persistant");
    if (assignment.hidden) {
        $temp.addClass("hide");
        $temp.find(".buttonHide").text("Show");
    }
    var classId = assignment.class;
    var classObj = getObjForKeyValue(data.classes, "id", classId);
    var className = (classObj) ? classObj.name : "Unknown";
    $temp.find(".class").text(className).attr("title", className);
    $temp.find(".name").children().eq(0)
        .text(assignment.name).attr("title", assignment.name);
    var dueStr = dateFromMonthAndDay(assignment.due.m,
                                     assignment.due.d);
    $temp.find(".due").text(dueStr).attr("title", dueStr);
    $temp.find("button").click(pressButton);

    $("#newAssignment").before($temp);
}

function getObjForKeyValue(array, key, value) {
    return array[getObjIndForKeyValue(array, key, value)];
}
function getObjIndForKeyValue(array, key, value) {
    for (var i = 0; i < array.length; i++) {
        if (array[i][key] == value) {
            return i;
        }
    }
    return null;
}

function deleteAssignment(id) {
    // Highlight assignment that will take it's visible space
    $("#" + id).next().focus();
    $("#" + id).remove();
    var ind = getObjIndForKeyValue(data.assignments, "id", id);
    data.assignments.splice(ind, 1);
    saveData();
}

function editAssigment(id) {
    var $row = $("#" + id);
    var editTemp = $("#templateEdit").get(0).cloneNode(true);
    editTemp.id = "";
    var $temp = $(editTemp);
    $temp.removeClass("persistant");
    // if it's focused, be sure to remember that fact
    $row.attr("data-wasfocused", $("#" + id).is(":focus"));

    // Disable all other buttons
    $("tr:not(.editting) button").prop("disabled", true);

    var className = $row.find(".class").text();
    $temp.find(".editClass").children().each(function(i, elem) {
        if (elem.innerHTML == className) {
            elem.selected = true;
        }
    });
    var name = $row.find(".name").children().eq(0).text();
    $temp.find(".editName").val(name);

    var dueVals = $row.find(".due").text().split("/");
    var m = parseInt(dueVals[0]);
    var d = parseInt(dueVals[1].split(" ")[0]);
    $temp.find(".editMonth").val(m);
    $temp.find(".editDay").val(d);
    $temp.find(".editWeekDay").text(weekDayFromDate(m, d));

    $temp.find(".buttonCancel, .buttonApply").click(pressButton);

    $temp.insertBefore($row);
    $row.addClass("hidden");

    $temp.find(".editClass").focus();

    // change the weekday when the due date changes
    $("input[type=\"number\"]").change(changeDate);
}
function confirmEditAssignment() {
    var id = parseInt($("tr.hidden").attr("id"));
    if (!data.assignments) data.assignments = [];
    var ind = getObjIndForKeyValue(data.assignments, "id", id);
    var $row = $("tr.editting:not(#templateEdit)");
    var wasFocused = ($("#" + id).attr("data-wasfocused") === "true");
    var className = $row.find(".editClass").val();
    var classId = getObjForKeyValue(data.classes, "name", className).id;
    if (ind == null) {
        // New assignment :D
        var newId = getNewAssignmentId();
        var d = new Date();
        var mo = d.getMonth() + 1;
        var da = d.getDate();
        if (!data.assignments) data.assignments = [];
        data.assignments.push({id:newId, due:{m: mo, d: da}});
        ind = data.assignments.length - 1;
    }
    data.assignments[ind].class = classId;

    data.assignments[ind].name = $row.find(".editName").val();

    var m = parseInt($row.find(".editMonth").val());
    var d = parseInt($row.find(".editDay").val());
    data.assignments[ind].due.m = m;
    data.assignments[ind].due.d = d;

    // Re-enable all other buttons
    $("tr button").prop("disabled", false);
    $(".buttonNew").removeClass("hidden");

    saveData();
    buildTable();

    $("#" + id).focus();
}

function cancelEditAssignment() {
    var id = parseInt($("tr.hidden").attr("id"));
    var obj = getObjForKeyValue(data.assignments, "id", id);
    if (obj == undefined) {
        // New class, get rid of it entirely
        $(".editting:not(#templateEdit), tr.hidden").remove();
        $(".buttonNew").removeClass("hidden");
        $("button").prop("disabled", false);
    } else {
        var wasFocused = $("#" + id).attr("data-wasfocused") === "true";

        // Go back to the way we had it before
        buildTable();
        $("button").prop("disabled", false);

        $("#" + id).focus();
    }
}

function pressKey(event) {
    var c = event.keyCode;
    var $focusTr = $("tr:focus");
    var focusing = ($focusTr.length > 0);
    var $editTr = $("tr.editting:not(#templateEdit)");
    var editting = ($editTr.length > 0);

    if (c === 13) {// enter
        if (editting) {
            $editTr.find("button.buttonApply").click();
            event.preventDefault();
        }
    } else if (c === 78) {// n
        if (!editting && $("#classList").hasClass("hidden")) {
            $(".buttonNew").click();
        }
    } else if (c === 88 || c === 68) {// x/d
        if (focusing) {
            $focusTr.find("button.buttonDelete").click();
        }
    } else if (c === 69) {// e
        if (focusing) {
            $focusTr.find("button.buttonEdit").click();
        }
    } else if (c === 72) {// h
        if (focusing) {
            $focusTr.find("button.buttonHide").click();
        }
    } else if (c === 67) {// c
        if (!editting) {
            $("#linkClasses").click();
        }
    } else if (c === 27) {// esc
        if (editting) {
            $editTr.find("button.buttonCancel").click();
            event.preventDefault();
        }
    } else if (c >= 48 && c <= 57) { // 1-0
        if (!editting) {
            if (c === 48) c += 10;
            c -= 49;
            $("#content > tbody > tr").eq(c).focus();
        }
    } else if (c === 38 || c === 40) { // up/down arrow keys
        if (!editting) {
            $("button:focus").parent().parent().focus();
            var $tr = $("tr.assignment:not(#templateAssignment):focus");
            if (c === 38) {
                if (!$tr.prev().focus().length) {
                    $(":focus").blur();
                }
            } else if (c === 40) {
                if ($tr.length) {
                    $tr.next().focus();
                } else {
                    $("tr.assignment").first().focus();
                }
            }
        }
    } else if (c === 39) { // right arrow key
        if (!editting) {
            $("button:focus").next().focus();
            $("tr.assignment:not(#templateAssignment):focus")
                .find(".buttonDelete").focus();
        }
    } else if (c === 37) { // left arrow key
        if (!editting) {
            $(".buttonDelete:focus").parent().parent().focus();
            $("button:focus").prev().focus();
        }
    }
}

function newAssignment() {
    if ($(".buttonNew").is(".hidden") ||
        $(".buttonNew").prop("disabled")) return;

    if (data.classes) {
        // Populate class list in #templateEdit
        var $firstOption = $(".editClass > option");
        $(".editClass").html($firstOption.first());
        for (var i = 0; i < data.classes.length; i++) {
            var option = $(".editClass > option").first().get(0);
            var newOption = option.cloneNode(true);
            newOption.innerHTML = data.classes[i].name;
            $(".editClass").append(newOption);
        }
        $firstOption.first().remove();
    }

    var newId = getNewAssignmentId();
    // add new one,
    var date = new Date();
    var mo = date.getMonth() + 1;
    var da = date.getDate();
    addAssignment(
        {id: newId, class: 0, hidden: false,
         name: "Homework", due: {m:mo, d:da}} );
    // immediately "edit" it
    editAssigment(newId);
    // hide the new button
    $(".buttonNew").addClass("hidden");
    $(".noAssignments").addClass("invisible");
}

function pressButton(event) {
    var elem = event.target;
    var id = $(elem).parentsUntil("tbody").last().attr("id");
    var isHidden = ($("#" + id).hasClass("hide"));

    if (elem.classList.contains("buttonDelete")) {
        deleteAssignment(id);
    } else if (elem.classList.contains("buttonEdit")) {
        editAssigment(id);
    } else if (elem.classList.contains("buttonHide")) {
        toggleRowHide(id);
    } else if (elem.classList.contains("buttonCancel")) {
        cancelEditAssignment();
    } else if (elem.classList.contains("buttonApply")) {
        confirmEditAssignment();
    } else if (elem.classList.contains("buttonNew")) {
        newAssignment();
    } else {
        alert("ERROR: Unrecognized button: " + elem.className);
    }
}

function changeDate(event) {
    var td = event.target.parentElement;
    var $td = $(td);
    var m = parseInt($td.find(".editMonth").val());
    var d = parseInt($td.find(".editDay").val());
    var date = new Date();
    date.setMonth(m - 1);
    date.setDate(d);
    if (d > getMaxDaysInMonth(m)) {
        d = 1;
        m++;
    }
    if (d < 1) {
        m--;
        d = getMaxDaysInMonth(m);
    }
    if (m > 12) {
        d = 1;
        m = 1;
    }
    if (m < 1) {
        m = 12;
        d = getMaxDaysInMonth(m);
    }
    $td.find(".editMonth").val(m);
    $td.find(".editDay").val(d);

    var weekDay = weekDayFromDate(m, d);//DAYS[date.getDay()];
    $td.find(".editWeekDay").text(weekDay);
}

function toggleRowHide(id) {
    var $elem = $("#" + id);
    var button = $elem.find(".buttonHide").get(0);
    var ind = getObjIndForKeyValue(data.assignments, "id", id);
    if (!$elem.hasClass("hide")) {
        $elem.addClass("hide");
        button.innerHTML = "Show";
        data.assignments[ind].hidden = true;
    } else {
        $elem.removeClass("hide");
        button.innerHTML = "Hide";
        data.assignments[ind].hidden = false;
    }
    saveData();
}

function getNewAssignmentId() {
    var maxId = 0;
    if (data.assignments) {
        for (var i = 0; i < data.assignments.length; i++) {
            maxId = Math.max(data.assignments[i].id, maxId);
        }
    }
    return maxId + 1;
}

function dateFromMonthAndDay(m, d) {
    var weekDay = weekDayFromDate(m, d);
    return m + "/" + d + ((weekDay != "") ? " (" + weekDay + ")" : "");
}

function weekDayFromDate(m, d) {
    var date = new Date();
    date.setMonth(m - 1);
    date.setDate(d);
    var daysTill = daysTillDate(new Date(), date);
    if (daysTill < 0) {
        return "OVERDUE";
    } else if (daysTill == 0) {
        return "TODAY";
    } else if (daysTill == 1) {
        return "Tomorrow";
    } else if (daysTill < 8) {
        return DAYS[date.getDay()];
    } else {
        return "";
    }
}

function daysTillDate(date1, date2) {
    var oneDay = 24 * 60 * 60 * 1000;
    return Math.round(
        (date2.getTime() - date1.getTime()) / oneDay);
}

function getMaxDaysInMonth(m) {
    return new Date(new Date().getFullYear(), m, 0).getDate();
}

function loadData() {
    try {
        return JSON.parse(localStorage[ASSIGNMENTS_KEY]);
    } catch (e) {
        // there's nothing in the localStorage yet
        return {};
    }
}

function saveData() {
    localStorage[ASSIGNMENTS_KEY] = JSON.stringify(data);
}
