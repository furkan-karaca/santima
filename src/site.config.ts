// Every value marked TODO must be confirmed by the owners before launch.
// Nothing on the public site should state a fact that is not true.

export type Channel = {
  id: "vk" | "max" | "phone" | "sms" | "avito" | "telegram";
  label: string;
  href: string;
  note?: string;
  cta?: string;
};

export const site = {
  name: "Сантима",
  nameLatin: "Santima",
  city: "Екатеринбург",

  // Contact channels in order of reliability for visitors in Russia (2026):
  // Telegram has been heavily throttled since February 2026 and WhatsApp is
  // effectively blocked, so they are never the only way in.
  // TODO: real URLs and number for each channel.
  channels: [
    { id: "vk", label: "ВКонтакте", href: "https://vk.ru/santima_atelier", note: "сообщения сообщества", cta: "Написать во ВКонтакте" },
    { id: "max", label: "MAX", href: "https://max.ru/", note: "мессенджер" },
    { id: "phone", label: "Позвонить", href: "tel:+70000000000", note: "+7 (000) 000-00-00" },
    { id: "avito", label: "Avito", href: "https://www.avito.ru/", note: "объявление мастерской" },
    { id: "telegram", label: "Telegram", href: "https://t.me/santima_atelier", note: "может работать с перебоями" },
  ] satisfies Channel[],

  // Seller identification required for services sold to consumers.
  // TODO: the maker's full name and INN as registered in «Мой налог».
  seller: {
    status: "Самозанятый",
    fullName: "Фамилия Имя Отчество",
    inn: "000000000000",
  },

  // Fallback order slots, used only until the CRM publishes slots.json.
  slots: {
    month: "октябрь",
    total: 20,
    free: 6,
  },

  // While true, every stock photograph carries a visible «фото-заглушка» tag.
  // The photographs are licensed Unsplash images of other makers' work and
  // must be replaced with the maker's own photos before launch.
  placeholderPhotos: true,
};

export const primaryChannel = site.channels[0];
