import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

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
    if (!farmer?.picture) return null;
    if (String(farmer.picture).startsWith("http")) return farmer.picture;
    return `${api.defaults.baseURL}${farmer.picture}`;
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
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="h-8 w-52 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse" />
        <div className="h-56 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse mb-6" />
        <div className="h-72 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-6xl mb-4">🔎</p>
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Farmer not found</h2>
        <button
          onClick={() => navigate("/products")}
          className="mt-5 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
        >
          Back to Products
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600 dark:text-red-400 font-semibold mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const certifications = Array.isArray(farmer?.certifications) ? farmer.certifications : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-28 h-28 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 shrink-0">
            {profileImageUrl ? (
              <img src={profileImageUrl} alt={farmer?.name || "Farmer"} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">👨‍🌾</div>
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">{farmer?.name || "-"}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Location: {farmer?.location || "-"}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Total Products: {farmer?.total_products ?? 0}</p>
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span
                    key={index}
                    className={`text-lg ${index < roundedRating ? "text-yellow-500" : "text-gray-300 dark:text-gray-600"}`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {ratingValue.toFixed(1)} / 5
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-4">Verified Certifications</h2>

        {certifications.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No verified certifications available.</p>
        ) : (
          <div className="space-y-3">
            {certifications.map((cert) => (
              <div key={cert.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-bold text-gray-900 dark:text-white">{cert.certificate_name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Issued by: {cert.issued_by || "-"}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Issued date: {formatDate(cert.issued_date)}</p>
                  </div>

                  <span className="inline-flex items-center self-start text-xs font-semibold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-full">
                    Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default FarmerPublicProfile;
