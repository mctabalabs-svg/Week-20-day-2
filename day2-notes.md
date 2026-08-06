A Telegram `message` update is delivered when the bot receives a normal chat message or command from the user. A `callback_query` update arrives when the user taps an inline keyboard button attached to a previous bot message.

You must answer callback queries using `answerCallbackQuery` so Telegram knows the button press was received and the client can stop showing the loading spinner. If you do not answer the callback query, the button spinner may hang indefinitely and the user experience breaks.

Callback queries also let you update the original message rather than sending a new one, which is why `editMessageText` is often used to transform the existing menu message once a button is tapped.
