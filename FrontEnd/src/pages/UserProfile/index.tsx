import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './UserProfile.module.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { FaUser, FaCalendar, FaPhone, FaMapMarkerAlt, FaVenusMars, FaCamera, FaSave, FaArrowLeft, FaKey, FaExclamationTriangle } from 'react-icons/fa';

interface UserProfile {
  user_id: string;
  username: string;
  email: string;
  full_name: string | null;
  dob: string | null;
  gender: 'Male' | 'Female' | null;
  phone_number: string | null;
  address: string | null;
  profile_picture_url: string | null;
}

const UserProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [formValues, setFormValues] = useState({
    full_name: '',
    dob: '',
    gender: '',
    phone_number: '',
    address: '',
    profile_picture_url: ''
  });

  // Separate authentication check as a proper useEffect - Modified to redirect without toast
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Fetch user profile data from API only if user exists
    if (!user) return;
    
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        // Use real API endpoint with withCredentials to include cookies for auth
        const response = await axios.get('http://localhost:5000/api/user/profile', {
          withCredentials: true
        });
        
        if (response.data && response.data.success) {
          const userData = response.data.user;
          setProfile(userData);
          setFormValues({
            full_name: userData.full_name || '',
            dob: userData.dob || '',
            gender: userData.gender || '',
            phone_number: userData.phone_number || '',
            address: userData.address || '',
            profile_picture_url: userData.profile_picture_url || ''
          });
        } else {
          // Fall back to basic user info if detailed profile not available
          if (user) {
            setProfile({
              user_id: user.user_id,
              username: user.username,
              email: user.email || '',
              full_name: '',
              dob: null,
              gender: null,
              phone_number: null,
              address: null,
              profile_picture_url: null
            });
          }
          toast.warning('Chỉ tìm thấy thông tin cơ bản của người dùng');
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        toast.error('Không thể tải thông tin người dùng');
        
        // Still set basic profile from auth context if API fails
        if (user) {
          setProfile({
            user_id: user.user_id,
            username: user.username,
            email: user.email || '',
            full_name: '',
            dob: null,
            gender: null,
            phone_number: null,
            address: null,
            profile_picture_url: null
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Real API call to update profile
      const response = await axios.put('http://localhost:5000/api/user/profile', formValues, {
        withCredentials: true
      });

      if (response.data && response.data.success) {
        // Update the local profile state with new values
        setProfile(prev => prev ? { 
          ...prev, 
          ...formValues,
          gender: formValues.gender as 'Male' | 'Female' | null 
        } : null);
        
        // Force a toast with autoClose set to ensure it appears
        toast.success('Cập nhật thông tin thành công', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        throw new Error(response.data?.message || 'Lỗi không xác định');
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.message || 'Cập nhật thông tin thất bại', {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle file upload for profile picture
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const maxSizeMB = 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    if (file.size > maxSizeBytes) {
      toast.error(`Kích thước file quá lớn. Giới hạn ${maxSizeMB}MB.`);
      return;
    }
    
    try {
      toast.info('Đang tải hình ảnh lên...');
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      // Upload to ImageKit via your backend API
      const response = await axios.post('http://localhost:5000/api/user/upload-avatar', formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data && response.data.success) {
        // Set the image URL returned from ImageKit
        setFormValues(prev => ({
          ...prev,
          profile_picture_url: response.data.imageUrl
        }));
        toast.success('Hình ảnh đã được tải lên. Nhấn "Lưu thay đổi" để cập nhật!');
      } else {
        throw new Error(response.data?.message || 'Lỗi khi tải ảnh lên');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.response?.data?.message || 'Không thể tải lên hình ảnh');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className={styles.profile_page}>
          <div className={styles.profile_loading}>
            <div className={styles.loading_spinner}></div>
            <p>Đang tải thông tin...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <ToastContainer />
      <div className={styles.profile_page}>
        <div className={styles.profile_container}>
          <div className={styles.profile_sidebar}>
            <div className={styles.profile_avatar}>
              <img 
                src={formValues.profile_picture_url || `https://ui-avatars.com/api/?name=${profile?.username || 'User'}&background=2c5282&color=fff`} 
                alt="Profile" 
              />
              <div className={styles.update_avatar}>
                <label htmlFor="avatar-upload" className={styles.avatar_upload_label}>
                  <FaCamera />
                </label>
                <input 
                  type="file" 
                  id="avatar-upload" 
                  className={styles.avatar_upload_input} 
                  accept="image/*" 
                  onChange={handleFileUpload}
                />
              </div>
            </div>
            
            <h2 className={styles.profile_name}>{profile?.username}</h2>
            <p className={styles.profile_email}>{profile?.email}</p>
            
            <div className={styles.profile_nav}>
              <button 
                className={`${styles.profile_nav_item} ${activeTab === 'info' ? styles.active : ''}`}
                onClick={() => setActiveTab('info')}
              >
                <FaUser className={styles.nav_icon} /> Thông tin cá nhân
              </button>
              <button 
                className={`${styles.profile_nav_item} ${activeTab === 'security' ? styles.active : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <FaKey className={styles.nav_icon} /> Bảo mật
              </button>
              <button 
                className={`${styles.profile_nav_item} ${activeTab === 'preferences' ? styles.active : ''}`}
                onClick={() => setActiveTab('preferences')}
              >
                <FaExclamationTriangle className={styles.nav_icon} /> Tài khoản
              </button>
            </div>

            <button className={styles.back_button} onClick={() => navigate('/')}>
              <FaArrowLeft /> Quay lại trang chủ
            </button>
          </div>
          
          <div className={styles.profile_content}>
            {activeTab === 'info' && (
              <>
                <div className={styles.content_header}>
                  <h1>Thông tin cá nhân</h1>
                  <p className={styles.subtitle}>Cập nhật thông tin cá nhân của bạn</p>
                </div>
                
                <form className={styles.profile_form} onSubmit={handleSubmit}>
                  <div className={styles.form_row}>
                    <div className={styles.form_group}>
                      <label htmlFor="full_name">
                        <FaUser className={styles.input_icon} /> Họ và tên
                      </label>
                      <input
                        type="text"
                        id="full_name"
                        name="full_name"
                        value={formValues.full_name}
                        onChange={handleInputChange}
                        placeholder="Nhập họ và tên"
                      />
                    </div>

                    <div className={styles.form_group}>
                      <label htmlFor="dob">
                        <FaCalendar className={styles.input_icon} /> Ngày sinh
                      </label>
                      <input
                        type="date"
                        id="dob"
                        name="dob"
                        value={formValues.dob || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className={styles.form_row}>
                    <div className={styles.form_group}>
                      <label htmlFor="gender">
                        <FaVenusMars className={styles.input_icon} /> Giới tính
                      </label>
                      <select
                        id="gender"
                        name="gender"
                        value={formValues.gender || ''}
                        onChange={handleInputChange}
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="Male">Nam</option>
                        <option value="Female">Nữ</option>
                      </select>
                    </div>

                    <div className={styles.form_group}>
                      <label htmlFor="phone_number">
                        <FaPhone className={styles.input_icon} /> Số điện thoại
                      </label>
                      <input
                        type="tel"
                        id="phone_number"
                        name="phone_number"
                        value={formValues.phone_number || ''}
                        onChange={handleInputChange}
                        placeholder="Nhập số điện thoại"
                      />
                    </div>
                  </div>

                  <div className={`${styles.form_group} ${styles.full_width}`}>
                    <label htmlFor="address">
                      <FaMapMarkerAlt className={styles.input_icon} /> Địa chỉ
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={formValues.address || ''}
                      onChange={handleInputChange}
                      placeholder="Nhập địa chỉ"
                      rows={3}
                    />
                  </div>

                  <div className={styles.form_actions}>
                    <button
                      type="submit"
                      className={styles.submit_button}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <div className={styles.button_spinner}></div>
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <FaSave /> Lưu thay đổi
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}

            {activeTab === 'security' && (
              <div className={styles.content_section}>
                <div className={styles.content_header}>
                  <h1>Bảo mật tài khoản</h1>
                  <p className={styles.subtitle}>Quản lý mật khẩu và bảo mật</p>
                </div>
                <div className={styles.security_content}>
                  <div className={styles.feature_coming_soon}>
                    <FaKey size={48} className={styles.coming_soon_icon} />
                    <h3>Tính năng đang phát triển</h3>
                    <p>Chức năng này sẽ sớm được cập nhật.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className={styles.content_section}>
                <div className={styles.content_header}>
                  <h1>Quản lý tài khoản</h1>
                  <p className={styles.subtitle}>Thay đổi tùy chọn tài khoản</p>
                </div>
                <div className={styles.preferences_content}>
                  <div className={styles.feature_coming_soon}>
                    <FaExclamationTriangle size={48} className={styles.coming_soon_icon} />
                    <h3>Tính năng đang phát triển</h3>
                    <p>Chức năng này sẽ sớm được cập nhật.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfile;
