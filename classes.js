$(function() {
    $("#linkClasses").click(function(event) {
        $("#classList").removeClass("hidden");
        $(".classItem > .className").first().focus();
    });
    
    $(".linkNewClass").click(function(event) {
        var classItem = {id:getNewClassId(), name:""};
        data.classes.push(classItem);
        addClassItem(classItem);
        $(".classItem:not(.persistant) > input").last().focus();
    });
    
    $("#classListCancel > a, #classList").click(function(event) {
        if ($(event.target).is(
            "#classListCancel > a, #classList")) {
            goBack();
        }
    });
    
    buildClassTable();
    
    $(document).keyup(function(event) {
        if (event.keyCode === 27) {// esc
            goBack();
        }
    });
});

function buildClassTable() {
    $(".classItem:not(.persistant)").remove();
    for (var i = 0; i < data.classes.length; i++) {
        var classItem = data.classes[i];
        addClassItem(classItem);
    }
}

function addClassItem(classItem) {
    var classElem = $("#templateClassItem").get(0).cloneNode(true);
    classElem.id = "c" + classItem.id;
    var $classElem = $(classElem);
    $classElem.removeClass("persistant");
    $classElem.find(".className").val(classItem.name);
    $classElem.find(".linkDeleteClass").click(deleteClass);
    $classElem.find(".className").change(changeClass);
    $("#templateClassItem").before($classElem);
}

function deleteClass(event) {
    var classItem = event.target.parentElement;
    var id = parseInt(classItem.id.substr(1));
    var ind = getObjIndForKeyValue(data.classes, "id", id);
    if (!ind) return;
    data.classes.splice(ind, 1);
    $(classItem).remove();
    saveData();
}

function changeClass(event) {
    var classItem = event.target.parentElement;
    var id = parseInt(classItem.id.substr(1));
    var ind = getObjIndForKeyValue(data.classes, "id", id);
    if (!ind) return;
    data.classes[ind].name = event.target.value;
    saveData();
}

function getNewClassId() {
    var maxId = 0;
    for (var i = 0; i < data.classes.length; i++) {
        maxId = Math.max(data.classes[i].id, maxId);
    }
    return maxId + 1;
}

function goBack() {
    $("#linkClasses").focus();
    $("#classList").addClass("hidden");
}