from PIL import Image, ImageDraw

def create_icon(size, filename):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Draw a blue circle
    draw.ellipse([0, 0, size, size], fill=(37, 99, 235))
    # Draw a white 'B'
    # Simple rectangle for now as text might need font
    margin = size // 4
    draw.rectangle([margin, margin, size-margin, size-margin], fill=(255, 255, 255))
    img.save(filename)

create_icon(16, 'icons/icon16.png')
create_icon(48, 'icons/icon48.png')
create_icon(128, 'icons/icon128.png')
