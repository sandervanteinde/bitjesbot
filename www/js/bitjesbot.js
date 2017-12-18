$('#connect-telegram').on('click', ev => {
    requestTelegramLink();
});
$('#logout').on('click', ev => {
    removeTelegramLink();
});
addHandler('new-reminder', reminder =>{
    $("table#reminders").append(
        $("<tr>").append(
            $("<td>").html(reminder.moment),
            $("<td>").html(reminder.text)
        )
    );
});