/**
 * FalakCart Affiliate Tracking Script
 * أضف هذا الكود في موقع فلك كارت الرئيسي
 */

(function() {
    'use strict';
    
    // إعدادات النظام
    const AFFILIATE_API_URL = 'http://localhost:8000/api'; // غير ده للخادم الحقيقي
    const COOKIE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 يوم
    
    /**
     * استخراج كود الإحالة من الرابط
     */
    function getReferralCode() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('ref');
    }
    
    /**
     * حفظ كود الإحالة في الكوكيز
     */
    function saveReferralCode(code) {
        const expires = new Date(Date.now() + COOKIE_DURATION).toUTCString();
        document.cookie = `referral_code=${code}; expires=${expires}; path=/; domain=.falakcart.com`;
        
        // حفظ في localStorage كمان
        localStorage.setItem('referral_code', code);
        localStorage.setItem('referral_timestamp', Date.now().toString());
        
        console.log('✅ Referral code saved:', code);
    }
    
    /**
     * تسجيل الكليك في نظام الأفلييت
     */
    async function recordClick(code) {
        try {
            const response = await fetch(`${AFFILIATE_API_URL}/track/click?ref=${code}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Click recorded:', data);
                return true;
            } else {
                console.error('❌ Failed to record click:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Click tracking error:', error);
            return false;
        }
    }
    
    /**
     * تسجيل البيع في نظام الأفلييت
     */
    async function recordSale(orderData) {
        const referralCode = getCookie('referral_code') || localStorage.getItem('referral_code');
        
        if (!referralCode) {
            console.log('ℹ️ No referral code found for sale');
            return false;
        }
        
        try {
            const payload = {
                referral_code: referralCode,
                amount: orderData.total,
                order_id: orderData.id,
                customer_email: orderData.email,
                product_name: orderData.product_name || 'FalakCart Subscription'
            };
            
            const response = await fetch(`${AFFILIATE_API_URL}/track/sale`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Sale recorded:', data);
                
                // مسح كود الإحالة بعد تسجيل البيع
                document.cookie = 'referral_code=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.falakcart.com';
                localStorage.removeItem('referral_code');
                localStorage.removeItem('referral_timestamp');
                
                return true;
            } else {
                console.error('❌ Failed to record sale:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Sale tracking error:', error);
            return false;
        }
    }
    
    /**
     * قراءة الكوكيز
     */
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }
    
    /**
     * إزالة معامل ref من الرابط
     */
    function cleanUrl() {
        const url = new URL(window.location);
        if (url.searchParams.has('ref')) {
            url.searchParams.delete('ref');
            window.history.replaceState({}, document.title, url.toString());
        }
    }
    
    /**
     * تشغيل التتبع عند تحميل الصفحة
     */
    function initializeTracking() {
        const referralCode = getReferralCode();
        
        if (referralCode) {
            console.log('🔗 Referral link detected:', referralCode);
            
            // حفظ كود الإحالة
            saveReferralCode(referralCode);
            
            // تسجيل الكليك
            recordClick(referralCode);
            
            // تنظيف الرابط
            cleanUrl();
        } else {
            // التحقق من وجود كود إحالة محفوظ
            const savedCode = getCookie('referral_code') || localStorage.getItem('referral_code');
            if (savedCode) {
                console.log('ℹ️ Existing referral code found:', savedCode);
            }
        }
    }
    
    // تشغيل التتبع عند تحميل الصفحة
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTracking);
    } else {
        initializeTracking();
    }
    
    // إتاحة دالة تسجيل البيع للاستخدام الخارجي
    window.FalakCartAffiliate = {
        recordSale: recordSale,
        getReferralCode: () => getCookie('referral_code') || localStorage.getItem('referral_code')
    };
    
    console.log('🚀 FalakCart Affiliate Tracking initialized');
})();