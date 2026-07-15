import { Link } from "react-router-dom";
import { Calendar, User, ArrowRight, ChevronRight } from "lucide-react";
import { useState } from "react";

// Mock data
const categories = ["Tất cả", "Phong thủy", "Chăm sóc cây", "Mẹo vặt", "Tin tức"];

const featuredPost = {
  id: 1,
  title: "Bí quyết chọn cây phong thủy theo mệnh giúp gia chủ hút tài lộc năm 2024",
  excerpt:
    "Việc chọn đúng cây phong thủy không chỉ giúp thanh lọc không khí mà còn mang lại may mắn, sức khỏe và tài lộc cho gia đình. Khám phá ngay cách chọn cây chuẩn xác nhất theo 5 bản mệnh: Kim, Mộc, Thủy, Hỏa, Thổ.",
  category: "Phong thủy",
  author: "Phong Thủy Guru",
  date: "12 Tháng 10, 2024",
  imageUrl:
    "https://images.squarespace-cdn.com/content/v1/663638597899f63cfa9deca6/1736727318707-KPNZ2QBTGEXVXAEC6WK8/7.16.24+Bristol+Botanics-27.jpg",
};

const posts = [
  {
    id: 2,
    title: "5 sai lầm phổ biến khi chăm sóc cây trong nhà bạn nên tránh",
    excerpt:
      "Tưới quá nhiều nước, đặt cây sai vị trí, không quan tâm đến ánh sáng... là những sai lầm khiến cây cảnh của bạn nhanh héo úa.",
    category: "Chăm sóc cây",
    author: "Admin",
    date: "10 Tháng 10, 2024",
    imageUrl:
      "https://s.yimg.com/ny/api/res/1.2/OjlgtatUjnfv6rMRAgVNSA--/YXBwaWQ9aGlnaGxhbmRlcjt3PTk2MDtoPTU0MDtjZj13ZWJw/https://media.zenfs.com/en/real_homes_245/4b07f622a522e2e612f3336385080532",
  },
  {
    id: 3,
    title: "Cây Kim Tiền: Ý nghĩa phong thủy và cách chăm sóc đúng chuẩn",
    excerpt:
      "Cây Kim Tiền được ví như thỏi nam châm hút tài lộc. Tuy nhiên để cây luôn xanh tốt và phát huy tối đa tác dụng phong thủy thì cần có bí quyết riêng.",
    category: "Mẹo vặt",
    author: "FengDesk Team",
    date: "05 Tháng 10, 2024",
    imageUrl:
      "https://www.thespruce.com/thmb/fQjL1wNf72Ez89dkS-VwpiQGiAM=/6127x0/filters:no_upscale():max_bytes(150000):strip_icc()/thespruce.com-best-houseplants-for-sun-4147670-1-3d69cd3cf2b943d9aa8363cde764e595.jpg",
  },
  {
    id: 4,
    title: "Top 7 loại cây để bàn làm việc giúp giảm căng thẳng hiệu quả",
    excerpt:
      "Không gian làm việc quá khô khan? Hãy bổ sung ngay những chậu cây nhỏ nhắn này để thanh lọc không khí và thư giãn tinh thần.",
    category: "Phong thủy",
    author: "Admin",
    date: "28 Tháng 9, 2024",
    imageUrl:
      "https://images.squarespace-cdn.com/content/v1/663638597899f63cfa9deca6/1736727318707-KPNZ2QBTGEXVXAEC6WK8/7.16.24+Bristol+Botanics-27.jpg",
  },
  {
    id: 5,
    title: "Phân biệt các loại sen đá và cách nhân giống đơn giản tại nhà",
    excerpt:
      "Sen đá là loại cây dễ trồng nhưng cần hiểu rõ đặc tính của từng dòng. Bài viết hướng dẫn cách nhân giống sen đá thành công 100%.",
    category: "Chăm sóc cây",
    author: "Plant Lover",
    date: "20 Tháng 9, 2024",
    imageUrl:
      "https://s.yimg.com/ny/api/res/1.2/OjlgtatUjnfv6rMRAgVNSA--/YXBwaWQ9aGlnaGxhbmRlcjt3PTk2MDtoPTU0MDtjZj13ZWJw/https://media.zenfs.com/en/real_homes_245/4b07f622a522e2e612f3336385080532",
  },
  {
    id: 6,
    title: "Sự kiện khai trương cửa hàng FengDesk chi nhánh mới",
    excerpt:
      "Mừng khai trương chi nhánh thứ 3, FengDesk tung hàng ngàn ưu đãi hấp dẫn cho khách hàng đến tham quan và mua sắm.",
    category: "Tin tức",
    author: "FengDesk Team",
    date: "15 Tháng 9, 2024",
    imageUrl:
      "https://www.thespruce.com/thmb/fQjL1wNf72Ez89dkS-VwpiQGiAM=/6127x0/filters:no_upscale():max_bytes(150000):strip_icc()/thespruce.com-best-houseplants-for-sun-4147670-1-3d69cd3cf2b943d9aa8363cde764e595.jpg",
  },
];

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState("Tất cả");

  const filteredPosts = posts.filter(
    (post) => activeCategory === "Tất cả" || post.category === activeCategory,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-500">
        <Link to="/" className="hover:text-primary transition-colors">
          Trang chủ
        </Link>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <span className="text-gray-900">Tin tức & Kiến thức</span>
      </nav>

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Tin tức & Kiến thức</h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Cập nhật những thông tin mới nhất về phong thủy, cách chăm sóc cây cảnh và các mẹo trang
          trí không gian sống từ chuyên gia.
        </p>
      </div>

      {/* Featured Post (Only show if 'Tất cả' is selected) */}
      {activeCategory === "Tất cả" && (
        <div className="mb-16 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group transition-all hover:shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="relative h-64 lg:h-full w-full overflow-hidden">
              <img
                src={featuredPost.imageUrl}
                alt={featuredPost.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full w-fit mb-4 uppercase tracking-wider">
                {featuredPost.category}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight group-hover:text-primary transition-colors">
                <Link to="#">{featuredPost.title}</Link>
              </h2>
              <p className="text-gray-600 mb-6 line-clamp-3">{featuredPost.excerpt}</p>
              <div className="flex items-center gap-6 text-sm text-gray-500 mb-8">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {featuredPost.author}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {featuredPost.date}
                </div>
              </div>
              <Link
                to="#"
                className="inline-flex items-center gap-2 font-semibold text-primary hover:text-primary-dark transition-colors"
              >
                Đọc bài viết <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
              activeCategory === category
                ? "bg-primary text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Posts Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group flex flex-col transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div className="relative h-56 w-full overflow-hidden">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-primary text-xs font-bold rounded-full shadow-sm">
                    {post.category}
                  </span>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                  <Link to="#">{post.title}</Link>
                </h3>
                <p className="text-gray-600 mb-6 line-clamp-3 text-sm flex-1">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100 mt-auto">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    {post.author}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {post.date}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          Không tìm thấy bài viết nào trong danh mục này.
        </div>
      )}
    </div>
  );
}
