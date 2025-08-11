// Sabit veri listeleri
let stockItems = [
    { code: "M001", name: "Çelik Sac", quantity: 150, location: "A-01" },
    { code: "M002", name: "Alüminyum Profil", quantity: 75, location: "A-02" },
    { code: "M003", name: "Paslanmaz Çelik Boru", quantity: 200, location: "B-01" },
    { code: "M004", name: "Kauçuk Conta", quantity: 300, location: "B-02" },
    { code: "M005", name: "Elektrik Kablosu", quantity: 500, location: "C-01" },
    { code: "M006", name: "Hidrolik Yağ", quantity: 25, location: "C-02" },
    { code: "M007", name: "Rulman", quantity: 100, location: "D-01" },
    { code: "M008", name: "Vida Seti", quantity: 1000, location: "D-02" },
    { code: "M009", name: "Motor Yağı", quantity: 50, location: "E-01" },
    { code: "M010", name: "Fren Balatası", quantity: 80, location: "E-02" }
];

let pendingRequests = [];
let approvedRequests = [];
let requestCounter = 1;

// DOM elementleri
const stockTableBody = document.getElementById('stockTableBody');
const pendingTableBody = document.getElementById('pendingTableBody');
const approvedTableBody = document.getElementById('approvedTableBody');
const modal = document.getElementById('requestModal');
const helpModal = document.getElementById('helpModal');
const modalItemName = document.getElementById('modalItemName');
const modalCurrentStock = document.getElementById('modalCurrentStock');
const requestAmount = document.getElementById('requestAmount');
const confirmRequest = document.getElementById('confirmRequest');
const cancelRequest = document.getElementById('cancelRequest');
const closeModal = document.querySelector('.close');

// İstatistik elementleri
const totalItemsElement = document.getElementById('totalItems');
const pendingCountElement = document.getElementById('pendingCount');
const approvedCountElement = document.getElementById('approvedCount');

// Sayfa yüklendiğinde çalışacak fonksiyon
document.addEventListener('DOMContentLoaded', function() {
    renderStockTable();
    renderPendingTable();
    renderApprovedTable();
    updateStats();
    setupEventListeners();
});

// Event listener'ları ayarla
function setupEventListeners() {
    // Modal kapatma işlemleri
    closeModal.addEventListener('click', closeRequestModal);
    cancelRequest.addEventListener('click', closeRequestModal);
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeRequestModal();
        }
        if (event.target === helpModal) {
            closeHelpModal();
        }
    });

    // Talep onaylama
    confirmRequest.addEventListener('click', submitRequest);
    
    // Smooth scrolling için nav link'leri
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Stok tablosunu render et
function renderStockTable() {
    stockTableBody.innerHTML = '';
    
    stockItems.forEach(item => {
        const row = document.createElement('tr');
        const stockClass = getStockClass(item.quantity);
        const statusBadge = getStatusBadge(item.quantity);
        
        row.innerHTML = `
            <td><strong>${item.code}</strong></td>
            <td>${item.name}</td>
            <td class="${stockClass}">${item.quantity}</td>
            <td>${item.location}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn btn-primary" onclick="openRequestModal('${item.code}')">
                    Talep Et
                </button>
            </td>
        `;
        
        stockTableBody.appendChild(row);
    });
}

// Onay bekleyen talepler tablosunu render et
function renderPendingTable() {
    pendingTableBody.innerHTML = '';
    
    if (pendingRequests.length === 0) {
        pendingTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    Onay bekleyen talep bulunmamaktadır.
                </td>
            </tr>
        `;
        return;
    }
    
    pendingRequests.forEach(request => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>#${request.id}</strong></td>
            <td>${request.itemCode}</td>
            <td>${request.itemName}</td>
            <td>${request.amount}</td>
            <td>${formatDate(request.requestDate)}</td>
            <td>
                <button class="btn btn-approve" onclick="approveRequest(${request.id})">
                    Onayla
                </button>
            </td>
        `;
        
        pendingTableBody.appendChild(row);
    });
}

// Onaylanan talepler tablosunu render et
function renderApprovedTable() {
    approvedTableBody.innerHTML = '';
    
    if (approvedRequests.length === 0) {
        approvedTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    Onaylanan talep bulunmamaktadır.
                </td>
            </tr>
        `;
        return;
    }
    
    approvedRequests.forEach(request => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>#${request.id}</strong></td>
            <td>${request.itemCode}</td>
            <td>${request.itemName}</td>
            <td>${request.amount}</td>
            <td>${formatDate(request.approvalDate)}</td>
        `;
        
        approvedTableBody.appendChild(row);
    });
}

// İstatistikleri güncelle
function updateStats() {
    totalItemsElement.textContent = stockItems.length;
    pendingCountElement.textContent = pendingRequests.length;
    approvedCountElement.textContent = approvedRequests.length;
}

// Talep modalını aç
function openRequestModal(itemCode) {
    const item = stockItems.find(item => item.code === itemCode);
    if (!item) return;
    
    modalItemName.textContent = item.name;
    modalCurrentStock.textContent = item.quantity;
    requestAmount.max = item.quantity;
    requestAmount.value = '';
    
    // Modal'ı aç
    modal.style.display = 'block';
    
    // Enter tuşu ile onaylama
    requestAmount.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            submitRequest();
        }
    });
}

// Talep modalını kapat
function closeRequestModal() {
    modal.style.display = 'none';
    requestAmount.value = '';
}

// Yardım modalını aç
function showHelp() {
    helpModal.style.display = 'block';
}

// Yardım modalını kapat
function closeHelpModal() {
    helpModal.style.display = 'none';
}

// Talep gönder
function submitRequest() {
    const amount = parseInt(requestAmount.value);
    const itemCode = modalItemName.textContent;
    const item = stockItems.find(item => item.name === itemCode);
    
    if (!amount || amount <= 0) {
        alert('Lütfen geçerli bir miktar giriniz!');
        return;
    }
    
    if (amount > item.quantity) {
        alert('Talep miktarı mevcut stoktan fazla olamaz!');
        return;
    }
    
    // Yeni talep oluştur
    const newRequest = {
        id: requestCounter++,
        itemCode: item.code,
        itemName: item.name,
        amount: amount,
        requestDate: new Date(),
        approvalDate: null
    };
    
    // Talebi listeye ekle
    pendingRequests.push(newRequest);
    
    // Tabloları güncelle
    renderPendingTable();
    updateStats();
    
    // Modal'ı kapat
    closeRequestModal();
    
    // Başarı mesajı
    showNotification('Talep başarıyla oluşturuldu!', 'success');
}

// Talebi onayla
function approveRequest(requestId) {
    const requestIndex = pendingRequests.findIndex(req => req.id === requestId);
    if (requestIndex === -1) return;
    
    const request = pendingRequests[requestIndex];
    const itemIndex = stockItems.findIndex(item => item.code === request.itemCode);
    
    if (itemIndex === -1) return;
    
    // Stoktan düş
    stockItems[itemIndex].quantity -= request.amount;
    
    // Talebi onaylanan listeye taşı
    request.approvalDate = new Date();
    approvedRequests.push(request);
    
    // Bekleyen taleplerden kaldır
    pendingRequests.splice(requestIndex, 1);
    
    // Tabloları güncelle
    renderStockTable();
    renderPendingTable();
    renderApprovedTable();
    updateStats();
    
    // Başarı mesajı
    showNotification('Talep onaylandı ve stoktan düşüldü!', 'success');
}

// Tüm bekleyen talepleri temizle
function clearAllPending() {
    if (pendingRequests.length === 0) {
        showNotification('Temizlenecek talep bulunmamaktadır.', 'info');
        return;
    }
    
    if (confirm('Tüm bekleyen talepleri silmek istediğinizden emin misiniz?')) {
        pendingRequests = [];
        renderPendingTable();
        updateStats();
        showNotification('Tüm bekleyen talepler temizlendi.', 'success');
    }
}

// Verileri yenile
function refreshData() {
    // Simüle edilmiş yenileme animasyonu
    const refreshBtn = document.querySelector('.section-actions .btn-primary');
    const originalText = refreshBtn.textContent;
    refreshBtn.innerHTML = '<span class="loading"></span> Yenileniyor...';
    refreshBtn.disabled = true;
    
    setTimeout(() => {
        renderStockTable();
        renderPendingTable();
        renderApprovedTable();
        updateStats();
        refreshBtn.textContent = originalText;
        refreshBtn.disabled = false;
        showNotification('Veriler yenilendi!', 'success');
    }, 1000);
}

// CSV olarak dışa aktar
function exportToCSV() {
    const headers = ['Kod', 'Malzeme Adı', 'Miktar', 'Raf Bilgisi', 'Durum'];
    const csvContent = [
        headers.join(','),
        ...stockItems.map(item => [
            item.code,
            `"${item.name}"`,
            item.quantity,
            item.location,
            getStatusText(item.quantity)
        ].join(','))
    ].join('\n');
    
    downloadCSV(csvContent, 'stok_durumu.csv');
    showNotification('Stok durumu CSV olarak indirildi!', 'success');
}

// Onaylanan talepleri CSV olarak dışa aktar
function exportApprovedToCSV() {
    if (approvedRequests.length === 0) {
        showNotification('İndirilecek onaylanan talep bulunmamaktadır.', 'info');
        return;
    }
    
    const headers = ['Talep No', 'Malzeme Kodu', 'Malzeme Adı', 'Talep Miktarı', 'Onay Tarihi'];
    const csvContent = [
        headers.join(','),
        ...approvedRequests.map(request => [
            request.id,
            request.itemCode,
            `"${request.itemName}"`,
            request.amount,
            formatDate(request.approvalDate)
        ].join(','))
    ].join('\n');
    
    downloadCSV(csvContent, 'onaylanan_talepler.csv');
    showNotification('Onaylanan talepler CSV olarak indirildi!', 'success');
}

// CSV dosyasını indir
function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Stok durumuna göre CSS sınıfı döndür
function getStockClass(quantity) {
    if (quantity <= 30) return 'stock-low';
    if (quantity <= 100) return 'stock-medium';
    return 'stock-high';
}

// Stok durumuna göre badge döndür
function getStatusBadge(quantity) {
    let status, className;
    if (quantity <= 30) {
        status = 'Düşük';
        className = 'status-low';
    } else if (quantity <= 100) {
        status = 'Orta';
        className = 'status-medium';
    } else {
        status = 'Yüksek';
        className = 'status-high';
    }
    
    return `<span class="status-badge ${className}">${status}</span>`;
}

// Stok durumuna göre metin döndür
function getStatusText(quantity) {
    if (quantity <= 30) return 'Düşük';
    if (quantity <= 100) return 'Orta';
    return 'Yüksek';
}

// Tarih formatla
function formatDate(date) {
    return new Date(date).toLocaleString('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Bildirim göster
function showNotification(message, type = 'info') {
    // Basit bir alert yerine daha güzel bir bildirim sistemi
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Stil ekle
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'info' ? '#3498db' : '#e74c3c'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    
    // CSS animasyonu ekle
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // 3 saniye sonra kaldır
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
    
    // Slide out animasyonu
    const slideOutStyle = document.createElement('style');
    slideOutStyle.textContent = `
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(slideOutStyle);
}

// Sayfa yenilendiğinde verileri localStorage'dan yükle (opsiyonel)
function loadDataFromStorage() {
    const savedStock = localStorage.getItem('depoStock');
    const savedPending = localStorage.getItem('depoPending');
    const savedApproved = localStorage.getItem('depoApproved');
    const savedCounter = localStorage.getItem('depoCounter');
    
    if (savedStock) stockItems = JSON.parse(savedStock);
    if (savedPending) pendingRequests = JSON.parse(savedPending);
    if (savedApproved) approvedRequests = JSON.parse(savedApproved);
    if (savedCounter) requestCounter = parseInt(savedCounter);
}

// Verileri localStorage'a kaydet (opsiyonel)
function saveDataToStorage() {
    localStorage.setItem('depoStock', JSON.stringify(stockItems));
    localStorage.setItem('depoPending', JSON.stringify(pendingRequests));
    localStorage.setItem('depoApproved', JSON.stringify(approvedRequests));
    localStorage.setItem('depoCounter', requestCounter.toString());
}

// Sayfa kapatılırken verileri kaydet
window.addEventListener('beforeunload', saveDataToStorage);

// Sayfa yüklendiğinde verileri yükle
window.addEventListener('load', loadDataFromStorage);

// Global fonksiyonları window objesine ekle
window.openRequestModal = openRequestModal;
window.approveRequest = approveRequest;
window.showHelp = showHelp;
window.closeHelpModal = closeHelpModal;
window.clearAllPending = clearAllPending;
window.refreshData = refreshData;
window.exportToCSV = exportToCSV;
window.exportApprovedToCSV = exportApprovedToCSV;
