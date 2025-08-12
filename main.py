import streamlit as st
import pandas as pd
import datetime
import json
from pathlib import Path
import plotly.express as px
import plotly.graph_objects as go

# Sayfa konfigürasyonu
st.set_page_config(
    page_title="Depo Malzeme Takip Sistemi",
    page_icon="🏭",
    layout="wide",
    initial_sidebar_state="expanded"
)

# CSS stilleri
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        padding: 1rem;
        border-radius: 10px;
        color: white;
        text-align: center;
        margin-bottom: 2rem;
    }
    .metric-card {
        background: white;
        padding: 1rem;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        text-align: center;
        border-left: 4px solid #667eea;
    }
    .stAlert {
        border-radius: 10px;
    }
</style>
""", unsafe_allow_html=True)

# Sabit veri listeleri (JavaScript'ten alınan veriler)
@st.cache_data
def get_initial_stock_data():
    return [
        {"code": "M001", "name": "Çelik Sac", "quantity": 150, "location": "A-01"},
        {"code": "M002", "name": "Alüminyum Profil", "quantity": 75, "location": "A-02"},
        {"code": "M003", "name": "Paslanmaz Çelik Boru", "quantity": 200, "location": "B-01"},
        {"code": "M004", "name": "Kauçuk Conta", "quantity": 300, "location": "B-02"},
        {"code": "M005", "name": "Elektrik Kablosu", "quantity": 500, "location": "C-01"},
        {"code": "M006", "name": "Hidrolik Yağ", "quantity": 25, "location": "C-02"},
        {"code": "M007", "name": "Rulman", "quantity": 100, "location": "D-01"},
        {"code": "M008", "name": "Vida Seti", "quantity": 1000, "location": "D-02"},
        {"code": "M009", "name": "Motor Yağı", "quantity": 50, "location": "E-01"},
        {"code": "M010", "name": "Fren Balatası", "quantity": 80, "location": "E-02"}
    ]

# Session state başlatma
if 'stock_items' not in st.session_state:
    st.session_state.stock_items = get_initial_stock_data()

if 'pending_requests' not in st.session_state:
    st.session_state.pending_requests = []

if 'approved_requests' not in st.session_state:
    st.session_state.approved_requests = []

if 'request_counter' not in st.session_state:
    st.session_state.request_counter = 1

# Yardımcı fonksiyonlar
def get_stock_status(quantity):
    if quantity <= 50:
        return "🔴 Kritik", "critical"
    elif quantity <= 100:
        return "🟡 Düşük", "warning"
    else:
        return "🟢 Normal", "normal"

def save_data():
    """Verileri JSON dosyasına kaydet"""
    try:
        data = {
            'stock_items': st.session_state.stock_items,
            'pending_requests': st.session_state.pending_requests,
            'approved_requests': st.session_state.approved_requests,
            'request_counter': st.session_state.request_counter
        }
        with open('depo_data.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2, default=str)
    except Exception as e:
        st.error(f"Veri kaydetme hatası: {e}")

def load_data():
    """Verileri JSON dosyasından yükle"""
    try:
        with open('depo_data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            st.session_state.stock_items = data.get('stock_items', get_initial_stock_data())
            st.session_state.pending_requests = data.get('pending_requests', [])
            st.session_state.approved_requests = data.get('approved_requests', [])
            st.session_state.request_counter = data.get('request_counter', 1)
    except (FileNotFoundError, Exception):
        # Dosya bulunamazsa veya hata olursa varsayılan verileri kullan
        pass

# Verileri yükle
load_data()

# Ana başlık
st.markdown("""
<div class="main-header">
    <h1>🏭 Depo Malzeme Takip Sistemi</h1>
    <p>Endüstriyel Stok Yönetimi Çözümü</p>
</div>
""", unsafe_allow_html=True)

# İstatistikler
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.markdown(f"""
    <div class="metric-card">
        <h3>{len(st.session_state.stock_items)}</h3>
        <p>Toplam Malzeme</p>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown(f"""
    <div class="metric-card">
        <h3>{len(st.session_state.pending_requests)}</h3>
        <p>Bekleyen Talep</p>
    </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown(f"""
    <div class="metric-card">
        <h3>{len(st.session_state.approved_requests)}</h3>
        <p>Onaylanan Talep</p>
    </div>
    """, unsafe_allow_html=True)

with col4:
    total_stock = sum(item['quantity'] for item in st.session_state.stock_items)
    st.markdown(f"""
    <div class="metric-card">
        <h3>{total_stock:,}</h3>
        <p>Toplam Stok</p>
    </div>
    """, unsafe_allow_html=True)

# Ana içerik
tab1, tab2, tab3, tab4 = st.tabs(["📦 Stok Durumu", "⏳ Bekleyen Talepler", "✅ Onaylanan Talepler", "📊 Raporlar"])

with tab1:
    st.header("📦 Stok Durumu")
    
    # Stok tablosu
    stock_df = pd.DataFrame(st.session_state.stock_items)
    stock_df['status'], stock_df['status_class'] = zip(*stock_df['quantity'].apply(get_stock_status))
    
    # Stok durumu görselleştirmesi
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.dataframe(
            stock_df[['code', 'name', 'quantity', 'location', 'status']],
            use_container_width=True,
            hide_index=True
        )
    
    with col2:
        # Stok durumu pasta grafiği
        status_counts = stock_df['status_class'].value_counts()
        fig = px.pie(
            values=status_counts.values,
            names=status_counts.index,
            title="Stok Durumu Dağılımı",
            color_discrete_map={
                'critical': '#ff4444',
                'warning': '#ffaa00',
                'normal': '#00aa00'
            }
        )
        st.plotly_chart(fig, use_container_width=True)
    
    # Talep oluşturma
    st.subheader("Yeni Talep Oluştur")
    col1, col2, col3 = st.columns(3)
    
    with col1:
        selected_item = st.selectbox(
            "Malzeme Seçin:",
            options=stock_df['name'].tolist(),
            key="item_select"
        )
    
    with col2:
        selected_item_data = next(item for item in st.session_state.stock_items if item['name'] == selected_item)
        request_amount = st.number_input(
            "Talep Miktarı:",
            min_value=1,
            max_value=selected_item_data['quantity'],
            value=1,
            key="amount_input"
        )
    
    with col3:
        st.write(f"Mevcut Stok: **{selected_item_data['quantity']}**")
        if st.button("Talep Oluştur", type="primary"):
            new_request = {
                'id': st.session_state.request_counter,
                'item_code': selected_item_data['code'],
                'item_name': selected_item_data['name'],
                'amount': request_amount,
                'date': datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                'status': 'Bekliyor'
            }
            st.session_state.pending_requests.append(new_request)
            st.session_state.request_counter += 1
            save_data()
            st.success(f"{selected_item} için {request_amount} adet talep oluşturuldu!")
            st.rerun()

with tab2:
    st.header("⏳ Bekleyen Talepler")
    
    if st.session_state.pending_requests:
        pending_df = pd.DataFrame(st.session_state.pending_requests)
        st.dataframe(pending_df, use_container_width=True, hide_index=True)
        
        col1, col2 = st.columns(2)
        
        with col1:
            if st.button("Tümünü Onayla", type="primary"):
                for request in st.session_state.pending_requests:
                    request['status'] = 'Onaylandı'
                    st.session_state.approved_requests.append(request)
                st.session_state.pending_requests = []
                save_data()
                st.success("Tüm talepler onaylandı!")
                st.rerun()
        
        with col2:
            if st.button("Tümünü Temizle", type="secondary"):
                st.session_state.pending_requests = []
                save_data()
                st.success("Tüm bekleyen talepler temizlendi!")
                st.rerun()
    else:
        st.info("Bekleyen talep bulunmuyor.")

with tab3:
    st.header("✅ Onaylanan Talepler")
    
    if st.session_state.approved_requests:
        approved_df = pd.DataFrame(st.session_state.approved_requests)
        st.dataframe(approved_df, use_container_width=True, hide_index=True)
        
        # CSV indirme
        csv = approved_df.to_csv(index=False, encoding='utf-8-sig')
        st.download_button(
            label="CSV İndir",
            data=csv,
            file_name=f"onaylanan_talepler_{datetime.datetime.now().strftime('%Y%m%d')}.csv",
            mime="text/csv"
        )
    else:
        st.info("Onaylanan talep bulunmuyor.")

with tab4:
    st.header("📊 Raporlar")
    
    # Stok verilerini yeniden oluştur
    stock_df = pd.DataFrame(st.session_state.stock_items)
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Stok miktarı grafiği
        fig1 = px.bar(
            stock_df,
            x='name',
            y='quantity',
            title="Malzeme Stok Miktarları",
            labels={'name': 'Malzeme', 'quantity': 'Miktar'}
        )
        fig1.update_xaxis(tickangle=45)
        st.plotly_chart(fig1, use_container_width=True)
    
    with col2:
        # Lokasyon bazlı stok dağılımı
        location_stats = stock_df.groupby('location')['quantity'].sum().reset_index()
        fig2 = px.pie(
            location_stats,
            values='quantity',
            names='location',
            title="Lokasyon Bazlı Stok Dağılımı"
        )
        st.plotly_chart(fig2, use_container_width=True)

# Sidebar
with st.sidebar:
    st.header("⚙️ Ayarlar")
    
    if st.button("Verileri Yenile"):
        load_data()
        st.success("Veriler yenilendi!")
    
    if st.button("Varsayılan Verilere Dön"):
        st.session_state.stock_items = get_initial_stock_data()
        st.session_state.pending_requests = []
        st.session_state.approved_requests = []
        st.session_state.request_counter = 1
        save_data()
        st.success("Varsayılan verilere dönüldü!")
        st.rerun()
    
    st.divider()
    
    st.header("📋 Hızlı İşlemler")
    
    # Stok güncelleme
    st.subheader("Stok Güncelle")
    update_item = st.selectbox("Malzeme:", [item['name'] for item in st.session_state.stock_items])
    new_quantity = st.number_input("Yeni Miktar:", min_value=0, value=0)
    
    if st.button("Güncelle"):
        for item in st.session_state.stock_items:
            if item['name'] == update_item:
                item['quantity'] = new_quantity
                break
        save_data()
        st.success(f"{update_item} stok miktarı {new_quantity} olarak güncellendi!")
        st.rerun()

# Footer
st.markdown("---")
st.markdown("""
<div style="text-align: center; color: #666; padding: 1rem;">
    <p>🏭 Depo Malzeme Takip Sistemi v2.0 | Streamlit ile geliştirildi</p>
</div>
""", unsafe_allow_html=True)
