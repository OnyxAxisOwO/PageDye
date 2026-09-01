from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps


ROOT = Path(r"E:\Project\PageDye")
OUT = ROOT / "store-assets" / "v1.0.3"
TMP = Path(r"C:\Users\OnyxAxis\AppData\Local\Temp")
W, H = 1280, 800

REGULAR = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 25)
SMALL = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 18)
BOLD = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 38)
PILL = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 17)


ITEMS = [
    {
        "src": TMP / "codex-clipboard-8330e0f2-0fda-4c3e-a687-8858b1a914a9.png",
        "out": "screenshot-01-ai-theme-lab-1280x800.png",
        "title": "AI Theme Lab",
        "subtitle": "Describe the look you want. Refine it through conversation.",
        "crop": (0, 126, 2360, 1299),
        "layout": "wide",
    },
    {
        "src": TMP / "codex-clipboard-b8304771-b138-42d9-b98b-040e56a2f03f.png",
        "out": "screenshot-02-site-management-1280x800.png",
        "title": "Manage Every Website",
        "subtitle": "Saved backgrounds, page rules, and groups in one clear view.",
        "crop": (390, 150, 2170, 1320),
        "layout": "wide",
    },
    {
        "src": TMP / "codex-clipboard-d086f9e7-0c3b-4972-98e6-fe7adc2cb590.png",
        "out": "screenshot-03-live-background-1280x800.png",
        "title": "See the Difference",
        "subtitle": "Turn an ordinary page into a background that feels like yours.",
        "crop": (0, 105, 2560, 1368),
        "layout": "wide",
    },
    {
        "src": TMP / "codex-clipboard-ce8c3dbe-9a4d-49aa-a14f-66aa715484d2.png",
        "out": "screenshot-04-quick-customization-1280x800.png",
        "title": "Customize in Seconds",
        "subtitle": "Colors, gradients, images, video, and effects — all close at hand.",
        "crop": None,
        "layout": "portrait",
    },
    {
        "src": TMP / "codex-clipboard-5a8ac2fa-01bb-4abb-b7ce-527a3892961c.png",
        "out": "screenshot-05-fine-tuning-1280x800.png",
        "title": "Fine-Tune Every Detail",
        "subtitle": "Adjust opacity, blur, brightness, contrast, and positioning.",
        "crop": None,
        "layout": "portrait",
    },
    {
        "src": TMP / "codex-clipboard-b367dee1-7416-4439-89ed-8e28e648f8c1.png",
        "out": "screenshot-06-theme-library-1280x800.png",
        "title": "Reuse Themes Anywhere",
        "subtitle": "Save complete looks and apply them across your favorite websites.",
        "crop": (250, 150, 2060, 1280),
        "layout": "wide",
    },
]


def rounded_mask(size, radius):
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius, fill=255)
    return mask


def cover(im, size):
    return ImageOps.fit(im, size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))


def make_background():
    return Image.new("RGBA", (W, H), (246, 246, 247, 255))


def add_brand(draw, canvas, portrait=False):
    icon = Image.open(ROOT / "Designer.png").convert("RGBA")
    icon.thumbnail((38, 38), Image.Resampling.LANCZOS)
    canvas.alpha_composite(icon, (64, 43))
    draw.text((112, 49), "PageDye", font=PILL, fill=(24, 24, 27, 255))


def paste_card(canvas, shot, box, radius=22):
    x, y, w, h = box
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((x + 1, y + 8, x + w + 1, y + h + 8), radius + 4, fill=(0, 0, 0, 32))
    shadow = shadow.filter(ImageFilter.GaussianBlur(14))
    canvas.alpha_composite(shadow)
    frame = Image.new("RGBA", (w + 4, h + 4), (245, 247, 255, 255))
    frame.paste(shot, (2, 2), shot if shot.mode == "RGBA" else None)
    frame.putalpha(rounded_mask(frame.size, radius))
    canvas.alpha_composite(frame, (x - 2, y - 2))
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle((x - 2, y - 2, x + w + 1, y + h + 1), radius, outline=(218, 218, 222, 255), width=1)


def locale_fonts(locale):
    if locale == "zh_CN":
        return (ImageFont.truetype(r"C:\Windows\Fonts\msyhbd.ttc", 38), ImageFont.truetype(r"C:\Windows\Fonts\msyh.ttc", 18))
    if locale == "ja":
        return (ImageFont.truetype(r"C:\Windows\Fonts\YuGothB.ttc", 38), ImageFont.truetype(r"C:\Windows\Fonts\YuGothM.ttc", 18))
    if locale == "ko":
        return (ImageFont.truetype(r"C:\Windows\Fonts\malgunbd.ttf", 38), ImageFont.truetype(r"C:\Windows\Fonts\malgun.ttf", 18))
    return BOLD, SMALL


def render(item, locale="en", copy=None, destination=None):
    canvas = make_background()
    draw = ImageDraw.Draw(canvas)
    add_brand(draw, canvas, item["layout"] == "portrait")
    title, subtitle = copy or (item["title"], item["subtitle"])
    title_font, subtitle_font = locale_fonts(locale)
    src = Image.open(item["src"]).convert("RGB")
    if item["crop"]:
        src = src.crop(item["crop"])

    if item["layout"] == "wide":
        draw.text((64, 96), title, font=title_font, fill=(24, 24, 27, 255))
        draw.text((66, 145), subtitle, font=subtitle_font, fill=(92, 92, 99, 255))
        area = (48, 188, 1184, 564)
        scale = min(area[2] / src.width, area[3] / src.height)
        shot = src.resize((round(src.width * scale), round(src.height * scale)), Image.Resampling.LANCZOS).convert("RGBA")
        box = (area[0] + (area[2] - shot.width) // 2, area[1] + (area[3] - shot.height) // 2, shot.width, shot.height)
        paste_card(canvas, shot, box, 16)
    else:
        draw.text((70, 176), title, font=title_font, fill=(24, 24, 27, 255))
        # Wrap the copy to preserve breathing room.
        words = subtitle.split()
        lines, line = [], ""
        for word in words:
            trial = (line + " " + word).strip()
            if draw.textlength(trial, font=subtitle_font) > 480 and line:
                lines.append(line)
                line = word
            else:
                line = trial
        lines.append(line)
        y = 245
        for text in lines:
            draw.text((72, y), text, font=subtitle_font, fill=(92, 92, 99, 255))
            y += 36
        draw.line((72, y + 38, 330, y + 38), fill=(190, 190, 194, 255), width=1)
        max_h = 690
        scale = min(500 / src.width, max_h / src.height)
        shot = src.resize((round(src.width * scale), round(src.height * scale)), Image.Resampling.LANCZOS).convert("RGBA")
        box = (W - 80 - shot.width, 72, shot.width, shot.height)
        paste_card(canvas, shot, box, 25)

    target = (destination or OUT) / item["out"]
    target.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(target, quality=96, optimize=True)


for entry in ITEMS:
    render(entry)

LOCALIZED = {
    "en": [(i["title"], i["subtitle"]) for i in ITEMS],
    "zh_CN": [
        ("AI 主题工作台", "用自然语言描述风格，并在对话中不断调整。"),
        ("管理每一个网站", "集中查看已保存的背景、页面规则与网站分组。"),
        ("让网页焕然一新", "把普通网页变成真正属于你的视觉空间。"),
        ("几秒完成个性化", "颜色、渐变、图片、视频和动效触手可及。"),
        ("精细调整每个细节", "自由调整透明度、模糊、亮度、对比度与位置。"),
        ("主题随处复用", "保存完整视觉方案，并应用到你喜欢的网站。"),
    ],
    "ja": [
        ("AI テーマラボ", "理想の雰囲気を言葉で伝え、会話しながら調整できます。"),
        ("サイトをまとめて管理", "保存した背景、ページルール、グループを一画面で管理。"),
        ("違いを実感", "いつものページを、自分らしい背景に変えられます。"),
        ("数秒でカスタマイズ", "色、グラデーション、画像、動画、エフェクトをすぐに選択。"),
        ("細部まで思いどおり", "透明度、ぼかし、明るさ、コントラスト、位置を調整。"),
        ("テーマをどこでも再利用", "完成したテーマを保存し、ほかのサイトにも適用できます。"),
    ],
    "ko": [
        ("AI 테마 작업실", "원하는 분위기를 설명하고 대화로 세밀하게 다듬으세요."),
        ("모든 사이트 관리", "저장된 배경, 페이지 규칙, 그룹을 한곳에서 확인하세요."),
        ("달라진 화면을 확인하세요", "평범한 페이지를 나만의 배경으로 바꿔 보세요."),
        ("몇 초 만에 꾸미기", "색상, 그라데이션, 이미지, 동영상과 효과를 바로 선택하세요."),
        ("모든 디테일 조정", "투명도, 흐림, 밝기, 대비와 위치를 세밀하게 조정하세요."),
        ("어디서나 테마 재사용", "완성된 테마를 저장하고 다른 사이트에도 적용하세요."),
    ],
    "de": [
        ("KI-Themenstudio", "Beschreibe deinen Stil und verfeinere ihn im Dialog."),
        ("Alle Websites verwalten", "Gespeicherte Hintergründe, Regeln und Gruppen auf einen Blick."),
        ("Den Unterschied sehen", "Verwandle jede Seite in einen Hintergrund, der zu dir passt."),
        ("In Sekunden anpassen", "Farben, Verläufe, Bilder, Videos und Effekte sofort auswählen."),
        ("Jedes Detail abstimmen", "Deckkraft, Unschärfe, Helligkeit, Kontrast und Position anpassen."),
        ("Themen überall nutzen", "Komplette Designs speichern und auf anderen Websites anwenden."),
    ],
    "fr": [
        ("Atelier de thèmes IA", "Décrivez le style voulu et affinez-le par la conversation."),
        ("Gérez tous vos sites", "Retrouvez vos arrière-plans, règles et groupes au même endroit."),
        ("Voyez la différence", "Transformez une page ordinaire en un espace qui vous ressemble."),
        ("Personnalisez en quelques secondes", "Couleurs, dégradés, images, vidéos et effets à portée de main."),
        ("Réglez chaque détail", "Ajustez opacité, flou, luminosité, contraste et position."),
        ("Réutilisez vos thèmes partout", "Enregistrez vos styles et appliquez-les à vos sites favoris."),
    ],
    "es": [
        ("Estudio de temas con IA", "Describe el estilo que quieres y ajústalo conversando."),
        ("Gestiona todos tus sitios", "Fondos, reglas de página y grupos en una sola vista."),
        ("Nota la diferencia", "Convierte cualquier página en un espacio que se sienta tuyo."),
        ("Personaliza en segundos", "Colores, degradados, imágenes, vídeos y efectos al instante."),
        ("Ajusta cada detalle", "Controla opacidad, desenfoque, brillo, contraste y posición."),
        ("Reutiliza temas donde quieras", "Guarda estilos completos y aplícalos en otros sitios."),
    ],
    "it": [
        ("Laboratorio temi AI", "Descrivi lo stile che desideri e perfezionalo conversando."),
        ("Gestisci tutti i siti", "Sfondi salvati, regole e gruppi in un'unica schermata."),
        ("Guarda la differenza", "Trasforma una pagina comune in uno spazio davvero tuo."),
        ("Personalizza in pochi secondi", "Colori, sfumature, immagini, video ed effetti a portata di mano."),
        ("Regola ogni dettaglio", "Modifica opacità, sfocatura, luminosità, contrasto e posizione."),
        ("Riutilizza i temi ovunque", "Salva stili completi e applicali ai tuoi siti preferiti."),
    ],
    "pt_BR": [
        ("Laboratório de temas com IA", "Descreva o visual desejado e refine tudo em uma conversa."),
        ("Gerencie todos os sites", "Fundos salvos, regras de página e grupos em um só lugar."),
        ("Veja a diferença", "Transforme qualquer página em um espaço com a sua cara."),
        ("Personalize em segundos", "Cores, gradientes, imagens, vídeos e efeitos ao seu alcance."),
        ("Ajuste cada detalhe", "Controle opacidade, desfoque, brilho, contraste e posição."),
        ("Reutilize temas em qualquer lugar", "Salve estilos completos e aplique-os em outros sites."),
    ],
    "ru": [
        ("Лаборатория тем с ИИ", "Опишите желаемый стиль и уточняйте его в диалоге."),
        ("Управление всеми сайтами", "Сохранённые фоны, правила и группы в одном месте."),
        ("Увидьте разницу", "Превратите обычную страницу в пространство со своим стилем."),
        ("Настройка за секунды", "Цвета, градиенты, изображения, видео и эффекты под рукой."),
        ("Настройте каждую деталь", "Меняйте прозрачность, размытие, яркость, контраст и положение."),
        ("Используйте темы снова", "Сохраняйте готовые стили и применяйте их на других сайтах."),
    ],
}

for locale, copies in LOCALIZED.items():
    locale_dir = OUT / "localized" / locale
    for entry, copy in zip(ITEMS, copies):
        render(entry, locale=locale, copy=copy, destination=locale_dir)

# QA contact sheet.
thumbs = []
for entry in ITEMS:
    im = Image.open(OUT / entry["out"]).convert("RGB")
    im.thumbnail((512, 320), Image.Resampling.LANCZOS)
    thumbs.append(im)
sheet = Image.new("RGB", (1048, 1000), (20, 23, 34))
for i, im in enumerate(thumbs):
    x = 8 + (i % 2) * 524
    y = 8 + (i // 2) * 330
    sheet.paste(im, (x, y))
sheet.save(OUT / "screenshots-contact-sheet.jpg", quality=92, optimize=True)

print("\n".join(str(OUT / item["out"]) for item in ITEMS))
