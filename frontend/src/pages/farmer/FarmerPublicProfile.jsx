import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { resolveMediaUrl } from "../../utils/media";

const FarmerPublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchFarmerProfile = async () => {
      try {
        setLoading(true);
        setError("");
        setNotFound(false);

        const res = await api.get(`/auth/farmers/${id}/`, {
          withCredentials: true,
        });

        setFarmer(res.data);
      } catch (err) {
        if (err?.response?.status === 404) {
          setNotFound(true);
        } else {
          setError("Failed to load farmer profile. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFarmerProfile();
  }, [id]);

  const profileImageUrl = useMemo(() => {
    return resolveMediaUrl(farmer?.picture);
  }, [farmer]);

  const ratingValue = Number(farmer?.avg_rating || 0);
  const roundedRating = Math.round(ratingValue);

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] flex flex-col pb-20 font-sans transition-colors duration-500">
        <div className="h-64 md:h-80 lg:h-96 w-full bg-gray-200 dark:bg-[#061A10]/50 animate-pulse relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
        </div>
        <div className="max-w-5xl mx-auto px-6 md:px-12 w-full relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-end -mt-20 md:-mt-28 mb-16">
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full border-8 border-[#FDFBF7] dark:border-[#0A0F0D] bg-gray-300 dark:bg-[#111812] animate-pulse shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
            </div>
            <div className="flex-1 space-y-4 w-full md:w-auto">
              <div className="h-12 w-3/4 md:w-1/2 bg-gray-300 dark:bg-[#111812] rounded-lg animate-pulse"></div>
              <div className="flex gap-4">
                <div className="h-8 w-32 bg-gray-300 dark:bg-[#111812] rounded-full animate-pulse"></div>
                <div className="h-8 w-32 bg-gray-300 dark:bg-[#111812] rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-40 bg-gray-200 dark:bg-[#111812]/50 rounded-2xl animate-pulse"></div>
            <div className="h-40 bg-gray-200 dark:bg-[#111812]/50 rounded-2xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#FDFBF7] dark:bg-[#0A0F0D] text-center px-4 font-sans">
        <p className="text-8xl mb-6 filter drop-shadow opacity-90 hover:scale-110 transition-transform duration-500">🔎</p>
        <h2 className="text-4xl md:text-5xl font-black text-[#111812] dark:text-[#E8F3EB] mb-4 tracking-tight">Farmer not found</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 text-lg font-medium">We couldn't locate the profile you're looking for. They might have relocated their digital barn.</p>
        <button
          onClick={() => navigate("/products")}
          className="px-8 py-4 bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-emerald-900/20"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#FDFBF7] dark:bg-[#0A0F0D] text-center px-4 font-sans">
        <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl mb-8">
            <p className="text-red-600 dark:text-red-400 font-bold text-xl">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-4 bg-[#111812] hover:bg-[#1A241A] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl font-bold transition-all duration-300 shadow-lg"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const certifications = Array.isArray(farmer?.certifications) ? farmer.certifications : [];

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0A0F0D] transition-colors duration-500 font-sans pb-24">
      
      {/* Hero Banner Area */}
      <div className="relative h-64 md:h-80 lg:h-96 w-full overflow-hidden bg-[#061A10]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A2617] to-[#04120B] opacity-95"></div>
        <div className="absolute top-[-30%] left-[-10%] w-[100%] h-[100%] rounded-full bg-emerald-600/10 blur-[130px]"></div>
        <div className="absolute bottom-[-10%] right-[-20%] w-[70%] h-[70%] rounded-full bg-yellow-600/5 blur-[120px]"></div>
        {/* Organic SVG Noise Texture */}
        <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay pointer-events-none" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')"}}></div>
        
        {/* Subtle background abstract mark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] overflow-hidden -z-0 pointer-events-none">
          <span className="text-[30rem] filter grayscale transform rotate-12">🌾</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Profile Card Header */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-end -mt-20 md:-mt-28 mb-16 relative">
          
          {/* Avatar Container with Glow Behind */}
          <div className="relative group">
            <div className="w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden border-8 border-[#FDFBF7] dark:border-[#0A0F0D] bg-[#111812] shadow-2xl relative z-20 shrink-0 object-cover">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt={farmer?.name || "Farmer"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">👨‍🌾</div>
              )}
            </div>
            {/* Soft background aura behind avatar */}
            <div className="absolute inset-0 rounded-full bg-emerald-500 blur-3xl opacity-20 -z-10 group-hover:opacity-40 transition-opacity duration-700 scale-110"></div>
          </div>

          {/* Titles & Meta Stats */}
          <div className="flex-1 pb-2 md:pb-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-[#111812] dark:text-[#E8F3EB] tracking-tight leading-[1.05] mb-4">
              {farmer?.name || "Anonymous Farmer"}
            </h1>
            
            <div className="flex flex-wrap items-center gap-3 md:gap-4">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white/60 dark:bg-[#111812]/80 backdrop-blur-md rounded-full border border-gray-200/80 dark:border-gray-800 shadow-sm transition-transform hover:-translate-y-0.5">
                <span className="text-lg">📍</span>
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{farmer?.location || "Unknown Location"}</span>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white/60 dark:bg-[#111812]/80 backdrop-blur-md rounded-full border border-gray-200/80 dark:border-gray-800 shadow-sm transition-transform hover:-translate-y-0.5">
                <span className="text-lg">📦</span>
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{farmer?.total_products ?? 0} Harvests</span>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm transition-transform hover:-translate-y-0.5 group cursor-default">
                <div className="flex -space-x-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span key={index} className={`text-lg drop-shadow-sm transition-colors duration-300 ${index < roundedRating ? "text-yellow-500 group-hover:text-yellow-400" : "text-gray-300 dark:text-gray-700"}`}>★</span>
                  ))}
                </div>
                <span className="text-sm font-black text-emerald-800 dark:text-emerald-400 pl-1.5">{ratingValue.toFixed(1)} <span className="font-medium opacity-60">/ 5</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Certifications Section */}
        <div className="mt-24">
          <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#111812] dark:text-[#E8F3EB] tracking-tight">
              Verified <span className="text-emerald-600 dark:text-emerald-500 italic font-serif font-medium tracking-normal">Credentials.</span>
            </h2>
            <div className="hidden md:flex h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 items-center justify-center ring-4 ring-white dark:ring-[#0A0F0D]">
              <span className="text-emerald-600 dark:text-emerald-400 text-xl font-bold">✓</span>
            </div>
          </div>

          {certifications.length === 0 ? (
            <div className="p-12 rounded-3xl bg-gray-50/50 dark:bg-[#111812]/50 border border-gray-200/50 dark:border-gray-800/50 text-center backdrop-blur-sm">
              <span className="text-5xl filter grayscale opacity-40 mb-6 block">📜</span>
              <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">No official credentials established yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
              {certifications.map((cert) => (
                <div key={cert.id} className="group relative overflow-hidden rounded-3xl bg-white dark:bg-[#111812] border border-gray-100 dark:border-gray-800/80 p-8 transition-all duration-500 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-900/10">
                  
                  {/* Subtle Interactive Noise on Card */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 mix-blend-overlay pointer-events-none" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')"}}></div>
                  
                  <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                    <div className="flex justify-between items-start">
                      <div className="p-4 rounded-2xl bg-[#FDFBF7] dark:bg-[#0A0F0D] border border-gray-100 dark:border-gray-800 text-emerald-600 dark:text-emerald-500 shadow-sm group-hover:scale-110 transition-transform duration-500">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-full border border-emerald-200/60 dark:border-emerald-800/30">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse relative">
                            <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75"></span>
                        </span>
                        Official
                      </span>
                    </div>
                    
                    <div className="transform transition-transform duration-500 group-hover:translate-x-1">
                      <h3 className="text-2xl font-extrabold text-[#111812] dark:text-[#E8F3EB] mb-4 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        {cert.certificate_name}
                      </h3>
                      <div className="space-y-2.5 text-sm">
                        <p className="flex items-center gap-3 text-gray-600 dark:text-gray-400 font-medium">
                          <span className="text-gray-400 dark:text-gray-500 text-lg">🏢</span> 
                          <span className="flex-1">{cert.issued_by || "Unknown Authority"}</span>
                        </p>
                        <p className="flex items-center gap-3 text-gray-500 dark:text-gray-500 font-medium">
                          <span className="text-gray-400 dark:text-gray-600 text-lg">📅</span> 
                          <span className="flex-1">Issued: {formatDate(cert.issued_date)}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default FarmerPublicProfile;
