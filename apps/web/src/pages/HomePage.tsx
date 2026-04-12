import React, { useRef, useState } from 'react';
import Layout from '../components/layout/Layout';
import { Plus, Receipt, TrendingDown, TrendingUp, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import TransactionForm from '../components/ui/TransactionForm';
import { useQueryClient } from '@tanstack/react-query';

const HomePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleAddNewManual = () => {
    setShowManualForm(true);
  };

  const handleManualSubmit = async (formData: any) => {
    try {
      await api.post('/transactions', formData);
      setShowManualForm(false);
      // Refresh summaries and transactions
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    } catch (error: any) {
      console.error('Manual entry failed:', error);
      alert('บันทึกไม่สำเร็จ: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleViewAll = () => {
    navigate('/transactions');
  };

  const handleTransactionClick = (id: number) => {
    alert(`ดูรายละเอียดรายการที่ #${id} (Mockup)`);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/slips/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Upload success:', data);
      // After upload and analysis, we refresh
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    } catch (error: any) {
      console.error('Upload failed:', error);
      alert('อัพโหลดสลิปล้มเหลว: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        {/* Manual Entry Modal */}
        {showManualForm && (
          <TransactionForm 
            onClose={() => setShowManualForm(false)} 
            onSubmit={handleManualSubmit}
          />
        )}

        {/* Hidden Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Header Summary */}
        <section className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02]">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-indigo-100 text-sm opacity-80">ยอดคงเหลือเดือนนี้</p>
              <h1 className="text-3xl font-bold mt-1">฿14,250.00</h1>
            </div>
            <button 
              onClick={handleAddNewManual}
              className="bg-white/20 p-2 rounded-xl backdrop-blur-md hover:bg-white/30 transition-colors"
            >
              <Plus size={24} />
            </button>
          </div>
          
          <div className="flex gap-4 mt-6">
            <div className="flex-1 bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-1 text-xs text-indigo-100 mb-1">
                <TrendingUp size={12} />
                <span>รายรับ</span>
              </div>
              <p className="font-semibold">฿25,000</p>
            </div>
            <div className="flex-1 bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-1 text-xs text-indigo-100 mb-1">
                <TrendingDown size={12} />
                <span>รายจ่าย</span>
              </div>
              <p className="font-semibold">฿10,750</p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleAddNewManual}
            className="flex flex-col items-center gap-3 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:border-indigo-200 hover:bg-indigo-50/50 transition-all"
          >
            <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600">
              <Plus size={24} />
            </div>
            <span className="text-sm font-semibold">บันทึกใหม่</span>
          </button>
          <button 
            onClick={handleUploadClick}
            disabled={isUploading}
            className={`flex flex-col items-center gap-3 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm transition-all ${
              isUploading 
                ? 'opacity-70 cursor-not-allowed' 
                : 'hover:border-emerald-200 hover:bg-emerald-50/50'
            }`}
          >
            <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600">
              {isUploading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <Receipt size={24} />
              )}
            </div>
            <span className="text-sm font-semibold">
              {isUploading ? 'กำลังวิเคราะห์...' : 'อัพโหลดสลิป'}
            </span>
          </button>
        </section>

        {/* Recent Transactions */}
        <section>
          <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="font-bold text-lg">รายการล่าสุด</h2>
            <button 
              onClick={handleViewAll}
              className="text-indigo-600 text-sm font-semibold hover:text-indigo-700 hover:underline"
            >
              ดูทั้งหมด
            </button>
          </div>
          
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                onClick={() => handleTransactionClick(i)}
                className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:translate-x-1 transition-transform cursor-pointer"
              >
                <div className="bg-orange-100 p-2.5 rounded-2xl text-orange-600">
                  <Receipt size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">อาหารเที่ยง - กะเพรา</p>
                  <p className="text-xs text-gray-400">วันนี้, 12:30 น.</p>
                </div>
                <p className="font-bold text-red-500">- ฿85</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default HomePage;
