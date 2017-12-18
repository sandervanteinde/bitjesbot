$('#connect-telegram').on('click', ev => {
    requestTelegramLink();
});
$('#logout').on('click', ev => {
    removeTelegramLink();
});