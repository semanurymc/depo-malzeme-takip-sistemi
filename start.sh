#!/bin/bash

echo "🏭 Depo Malzeme Takip Sistemi Başlatılıyor..."
echo ""
echo "Tarayıcınızda otomatik olarak açılacaktır."
echo "Kapatmak için Ctrl+C tuşlayın."
echo ""

# Farklı işletim sistemleri için tarayıcı açma
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open index.html 2>/dev/null || sensible-browser index.html 2>/dev/null || firefox index.html 2>/dev/null || google-chrome index.html 2>/dev/null || chromium-browser index.html 2>/dev/null
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open index.html
else
    # Diğer sistemler
    echo "Lütfen index.html dosyasını tarayıcınızda manuel olarak açın."
fi

echo "Uygulama başlatıldı! Tarayıcınızda açıldı."
echo ""
echo "Web sunucusu ile çalıştırmak için:"
echo "python -m http.server 8000"
echo "Sonra http://localhost:8000 adresine gidin"




