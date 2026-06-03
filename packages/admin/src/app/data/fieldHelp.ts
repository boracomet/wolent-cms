/** Türkçe alan türü yardım metinleri — ContentBuilder alan seçici */

export const FIELD_TYPE_HELP: Record<string, string> = {
  text: "Kısa metin alanı (başlık, isim, vb.)",
  text_long: "Uzun metin (paragraf, açıklama)",
  blocks: "Zengin metin editörü (resim, bağlantı, kod)",
  richtext: "Zengin metin editörü (resim, bağlantı, kod)",
  number_int: "Sayısal değer",
  number_float: "Sayısal değer",
  number_big: "Sayısal değer",
  boolean: "Evet/Hayır seçimi",
  date: "Tarih seçimi",
  time: "Saat seçimi",
  datetime: "Tarih ve saat seçimi",
  media: "Dosya veya resim yükleme",
  relation: "Başka bir içerik türüne bağlantı",
  json: "Yapılandırılmış veri",
  uid: "Benzersiz tanımlayıcı (URL dostu)",
  email: "E-posta adresi",
  enumeration: "Hazır listeden seçim",
  password: "Güvenli parola alanı",
  component: "Tekrarlanabilir alan grubu",
  dynamiczone: "Karışık bileşen alanları",
};

export function getFieldTypeHelp(typeId: string): string | undefined {
  const id = typeId === "richtext" ? "blocks" : typeId === "textarea" ? "text_long" : typeId;
  return FIELD_TYPE_HELP[id];
}
