
export class TelegramUser {
    public id: number;
    public is_bot: boolean;
    public first_name: string;
    public last_name: string;
    public username: string;
    public language_code: string;
}
export enum ChatType {
    private = 'private',
    group = 'group',
    supergroup = 'supergroup',
    channel = 'channel'
}
export class TelegramChat {
    public id: number;
    public type: ChatType;
    public title: string;
    public username: string;
    public first_name: string;
    public last_name: string;
    public all_members_are_administrators: boolean;
    public photo: TelegramChatPhoto;
    public description: string;
    public invite_link: string;
    public pinned_message: TelegramMessage;
    public sticker_set_name: string;
    public can_set_sticker_set: boolean;
}
export class TelegramMessage {
    public message_id: number;
    public from: TelegramUser;
    public date: number;
    public chat: TelegramChat;
    public forward_from: TelegramUser;
    public forward_from_chat: TelegramChat;
    public forward_from_message_id: number;
    public forward_signature: string;
    public forward_date: number;
    public reply_to_message: TelegramMessage;
    public edit_date: number;
    public media_group_id: string;
    public author_signature: string;
    public text: string;
    public entities: TelegramMessageEntity[];
    public caption_entities: TelegramMessageEntity[];
    public audio: TelegramAudio;
    public document: TelegramDocument;
    public sticker: TelegramSticker;
    public video: TelegramVideo;
    public video_note: TelegramVideoNote;
    public game: TelegramGame;
    public voice: TelegramVoice;
    public caption: string;
    public contact: TelegramContact;
    public location: TelegramLocation;
    public venue: TelegramVenue;
    public new_chat_members: TelegramUser[];
    public left_chat_member: TelegramUser;
    public new_chat_title: string;
    public new_chat_photo: TelegramPhotoSize[];
    public delete_chat_photo: boolean;
    public group_chat_created: boolean;
    public supergroup_chat_created: boolean;
    public channel_chat_created: boolean;
    public migrate_to_chat_id: number;
    public migrate_from_chat_id: number;
    public pinned_message: TelegramMessage;
    public invoice: TelegramInvoice;
    public successful_payment: TelegramSuccessfulPayment;
}
export class TelegramPhotoSize {
    public file_id: string;
    public width: number;
    public height: number;
    public file_size: number;
}
export class TelegramVenue {
    public location: TelegramLocation;
    public title: string;
    public address: string;
    public foursquare_id: string;
}
export class TelegramLocation {
    public longitude: number;
    public latitude: number;
}
export class TelegramContact {
    public phone_number: string;
    public first_name: string;
    public last_name: string;
    public user_id: number;
}
export class TelegramVoice {
    public file_id: string;
    public duration: number;
    public mime_type: string;
    public file_size: number;
}
export class TelegramVideo {
    public file_id: string;
    public width: number;
    public height: number;
    public duration: number;
    public thumb: TelegramPhotoSize;
    public mime_type: string;
    public file_size: number;
}
export class TelegramVideoNote {
    public file_id: string;
    public length: number;
    public duration: number;
    public thumb: TelegramPhotoSize;
    public file_size: number;
}
export class TelegramSticker {
    public file_id: string;
    public width: number;
    public height: number;
    public thumb: TelegramPhotoSize;
    public emoji: string;
    public set_name: string;
    public mask_position: TelegramMaskPosition;
    public file_size: number;
}
export class TelegramStickerSet {
    public name: string;
    public title: string;
    public contains_masks: boolean;
    public stickers: TelegramSticker[];
}
export class TelegramMaskPosition {
    public point: string;
    public x_shift: number;
    public y_shift: number;
    public scale: number;
}
export class TelegramAudio {
    public file_id: string;
    public duration: number;
    public performer: string;
    public title: string;
    public mime_type: string;
    public file_size: number;
}
export class TelegramDocument {
    public file_id: string;
    public thumb: TelegramPhotoSize;
    public file_name: string;
    public mime_type: string;
    public file_size: number;
}
export class TelegramMessageEntity {
    public type: string;
    public offset: number;
    public length: number;
    public url: string;
    public user: TelegramUser;
}
export class TelegramChatPhoto {
    public small_file_id: string;
    public big_file_id: string;
}
export class TelegramUserProfilePhotos {
    public total_count: number;
    public photos: TelegramPhotoSize[];
}

export class TelegramFile {
    public file_id: string;
    public file_size: number;
    public file_path: string;
}
export class TelegramReplyKeyboardMarkup {
    public keyboard: TelegramKeyboardButton[][];
    public resize_keyboard: boolean;
    public one_time_keyboard: boolean;
    public selective: boolean;
}
export class TelegramKeyboardButton {
    public text: string;
    public request_contact: boolean;
    public request_location: boolean;
}
export class TelegramReplyKeyboardRemove {
    public remove_keyboard: boolean;
    public selective: boolean;
}
export class TelegramInlineKeyboardMarkup {
    public inline_keyboard: TelegramInlineKeyboardButton[][];
}
export class TelegramInlineKeyboardButton {
    public text: string;
    public callback_data: string;
    public url: string;
    public switch_inline_query: string;
    public switch_inline_query_current_chat: string;
    public callback_game: TelegramCallbackGame;
    public pay: boolean;
}
export class TelegramCallbackGame {
    //placeholder?
}
export class TelegramForceReply {
    public force_reply: boolean;
    public selective: boolean;
}
export class TelegramChatMember {
    public user: TelegramUser;
    public status: string;
    public until_date: number;
    public can_be_edited: boolean;
    public can_change_info: boolean;
    public can_post_messages: boolean;
    public can_edit_messages: boolean;
    public can_delete_messages: boolean;
    public can_invite_users: boolean;
    public can_restrict_members: boolean;
    public can_pin_messages: boolean;
    public can_promote_members: boolean;
    public can_send_messages: boolean;
    public can_send_media_messages: boolean;
    public can_send_other_messages: boolean;
    public can_send_web_page_previews: boolean;
}

export class TelegramResponseParameters {
    public migrate_to_chat_id: number;
    public retry_after: number;
}

export class TelegramInputMedia {
    public type: string;
    public media: string;
    public caption: string;
}
export class TelegramInputMediaPhoto extends TelegramInputMedia {
    //equals TelegramInputMedia
}
export class IelegramInputMediaVideo extends TelegramInputMedia {
    public width: number;
    public height: number;
    public duration: number;
}

export class TelegramLabeledPrice {
    public label: string;
    public amount: number;
}

export class TelegramSuccessfulPayment {
    public currency: string;
    public total_amount: number;
    public invoice_payload: string;
    public shipping_option_id: string;
    public order_info: TelegramOrderInfo;
    public telegram_payment_charge_id: string;
    public provider_payment_charge_id: string;
}
export class TelegramInvoice {
    public title: string;
    public description: string;
    public start_parameter: string;
    public currency: string;
    public total_amount: number;
}
export class TelegramShippingAddress {
    public country_code: string;
    public state: string;
    public city: string;
    public street_line1: string;
    public street_line2: string;
    public post_code: string;
}
export class TelegramOrderInfo {
    public name: string;
    public phone_number: string;
    public email: string;
    public shipping_address: TelegramShippingAddress;
}
export class TelegramShippingOption {
    public id: string;
    public title: string;
    public prices: TelegramLabeledPrice[];
}
export class TelegramShippingQuery {
    public id: string;
    public from: TelegramUser;
    public invoice_payload: string;
    public shipping_address: string;
}
export class TelegramPreCheckoutQuery {
    public id: string;
    public user: TelegramUser;
    public currency: string;
    public total_amount: number;
    public invoice_payload: string;
    public shipping_option_id: string;
    public order_info: TelegramOrderInfo;
}


export class TelegramGame {
    public title: string;
    public description: string;
    public photo: TelegramPhotoSize[];
    public text: string;
    public text_entities: TelegramMessageEntity[];
    public animation: TelegramAnimation;
}
export class TelegramAnimation {
    public file_id: string;
    public thumb: TelegramPhotoSize;
    public file_name: string;
    public mime_type: string;
    public file_size: number;
}
export class TelegramSendMessage {
    public chat_id: number;
    public text: string;
    public parse_mode?: string;
    public disable_web_page_preview?: boolean;
    public reply_to_message_id?: number;
    public reply_markup?: TelegramInlineKeyboardMarkup | TelegramReplyKeyboardMarkup | TelegramForceReply | TelegramReplyKeyboardRemove;
}
export class TelegramUpdate {
    public update_id: number;
    public message: TelegramMessage;
    public edited_message: TelegramMessage;
    public channel_post: TelegramMessage;
    public edited_channel_post: TelegramMessage;
    public inline_query: TelegramInlineQuery;
    public chosen_inline_result: TelegramChosenInlineResult;
    public callback_query: TelegramCallbackQuery;
    public shipping_query: TelegramShippingQuery;
    public pre_checkout_query: TelegramPreCheckoutQuery;
}
export class TelegramInlineQuery {
    public id: string;
    public from: TelegramUser;
    public location: TelegramLocation;
    public query: string;
    public offset: string;
    public message: TelegramMessage
}
export class TelegramChosenInlineResult {
    public result_id: string;
    public from: TelegramUser;
    public location: TelegramLocation;
    public inline_message_id: string;
    public query: string;
}
export class TelegramCallbackQuery {
    public id: string;
    public from: TelegramUser;
    public message: TelegramMessage;
    public inline_message_id: string;
    public chat_instance: string;
    public data: string;
    public game_short_name: string;
}
export class TelegramResponse<T>{
    public ok: boolean;
    public result: T;
    public description: string;
    public error_code: number;
    public parameters: TelegramResponseParameters;
}