$('#connect-telegram').on('click', ev => {
    requestTelegramLink();
});
$('#logout').on('click', ev => {
    removeTelegramLink();
});
addHandler('new-reminder', reminder =>{
    $("table#reminders tbody").append(
        $("<tr>").append(
            $("<td>").html(moment(reminder.moment).format('dddd D MMMM HH:mm')),
            $("<td>").html(reminder.text)
        )
    );
});
onWebSocket(() => {
    $('button').attr('disabled', null);
});
let timePicker = $('.timepicker').pickatime({
    twelvehour: false,
    default: 'now',
    closeOnSelect: true,
    hiddenName: true
});
let datePicker = $('.datepicker').pickadate({
    formatSubmit: 'yyyy/mm/dd',
    format: 'dddd dd mmmm',
    selectYears: 2,
    min: new Date(),
    closeOnSelect: true,
    hiddenName: true
}).pickadate('picker');
$("#add-reminder-btn").on('click', () => {
    let obj = {
        time: timePicker.val(),
        date: datePicker.get('select', 'yyyy-mm-dd'),
        text: $("#text").val()
    };
    if(!obj.date)
        return $('.datepicker').addClass('invalid')
    else
        $('.datepicker').removeClass('invalid');
    if(!obj.time)
        return timePicker.addClass('invalid');
    else
        timePicker.removeClass('invalid');
    if(!obj.text)
        return $('#text').addClass('invalid');
    else
        $('#text').removeClass('invalid');
    sendMessage('add-reminder', obj);
    $('.datepicker').val('');
    $('#text').val('');
    timePicker.val('');
});