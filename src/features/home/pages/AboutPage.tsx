import { motion } from "framer-motion";
import { Leaf, ShieldCheck, Heart, Sparkles, Sprout, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import FengShui from "@/assets/image/FengShuiv2.png";

export default function AboutPage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" },
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Breadcrumb */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 relative z-20">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <Link to="/" className="hover:text-primary transition-colors">
              Trang chủ
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="text-gray-900">Về chúng tôi</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative flex h-[60vh] min-h-[400px] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://hips.hearstapps.com/hmg-prod/images/laptop-on-wooden-table-in-home-interior-with-many-royalty-free-image-1737491671.pjpeg?crop=1.00xw:0.752xh;0,0.183xh&resize=1200:*"
            alt="Hero Feng Shui"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="mb-4 inline-block rounded-full border border-green-400/30 bg-green-500/20 px-3 py-1 text-sm font-medium tracking-wider text-green-100 backdrop-blur-md">
              HÀNH TRÌNH CỦA CHÚNG TÔI
            </span>
            <h1 className="mb-6 drop-shadow-lg text-4xl font-bold tracking-tight text-white md:text-6xl">
              Mang <span className="text-green-400">Sinh Khí</span> Vào Mọi Không Gian
            </h1>
            <p className="mx-auto max-w-2xl drop-shadow-md text-lg text-gray-200 md:text-xl">
              FengDesk không chỉ cung cấp cây cảnh, chúng tôi mang đến giải pháp phong thủy hoàn hảo
              giúp không gian của bạn tràn đầy vượng khí, tài lộc và bình an.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="order-2 lg:order-1"
          >
            <div className="group relative aspect-[4/5] overflow-hidden rounded-2xl shadow-2xl md:aspect-auto md:h-[400px]">
              <img
                src={FengShui}
                alt="Our Workspace"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="order-1 space-y-6 lg:order-2"
          >
            <div className="flex items-center gap-3 text-sm font-semibold tracking-wider text-green-600 uppercase">
              <Sprout className="h-5 w-5" />
              Câu Chuyện FengDesk
            </div>
            <h2 className="text-3xl font-bold leading-tight text-gray-900 md:text-5xl">
              Sự kết hợp giữa Phong Thủy & Công Nghệ
            </h2>
            <p className="text-lg leading-relaxed text-gray-600">
              Xuất phát từ niềm đam mê thiên nhiên và triết lý âm dương ngũ hành, chúng tôi hiểu
              rằng mỗi loài cây đều mang một tần số năng lượng riêng biệt, ảnh hưởng trực tiếp đến
              sinh khí và tài vận của không gian sống.
            </p>
            <p className="text-lg leading-relaxed text-gray-600">
              FengDesk tự hào là nền tảng tiên phong ứng dụng Trí tuệ nhân tạo (AI) vào việc phân
              tích cung mệnh. Chúng tôi mang đến giải pháp tư vấn cá nhân hóa, giúp bạn dễ dàng chọn
              được những loài cây tương sinh, hòa hợp nhất để thu hút may mắn và thịnh vượng.
            </p>

            <div className="flex flex-wrap gap-8 border-t border-gray-200 pt-6">
              <div>
                <h4 className="mb-2 text-4xl font-bold text-green-600">5+</h4>
                <p className="font-medium text-gray-500">Năm Kinh Nghiệm</p>
              </div>
              <div>
                <h4 className="mb-2 text-4xl font-bold text-green-600">10k+</h4>
                <p className="font-medium text-gray-500">Khách Hàng Hài Lòng</p>
              </div>
              <div>
                <h4 className="mb-2 text-4xl font-bold text-green-600">100+</h4>
                <p className="font-medium text-gray-500">Loài Cây Khác Nhau</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-5xl">Giá Trị Cốt Lõi</h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Những nguyên tắc nền tảng định hình mọi quyết định và hành động của chúng tôi mỗi
              ngày.
            </p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4"
          >
            {[
              {
                icon: <Leaf className="h-8 w-8 text-green-500" />,
                title: "Thuận Tự Nhiên",
                desc: "Tôn trọng sự phát triển tự nhiên, mang đến những loài cây khỏe mạnh và tràn đầy sức sống nhất.",
              },
              {
                icon: <Sparkles className="h-8 w-8 text-amber-500" />,
                title: "Chuẩn Phong Thủy",
                desc: "Tư vấn dựa trên nền tảng khoa học phong thủy, đảm bảo sự tương sinh, hòa hợp với mệnh gia chủ.",
              },
              {
                icon: <ShieldCheck className="h-8 w-8 text-blue-500" />,
                title: "Chất Lượng Uy Tín",
                desc: "Tuyển chọn khắt khe từ khâu ươm trồng đến khi giao tận tay khách hàng. Bảo hành sức khỏe cây.",
              },
              {
                icon: <Heart className="h-8 w-8 text-rose-500" />,
                title: "Tận Tâm Phục Vụ",
                desc: "Đồng hành cùng bạn trong suốt quá trình chăm sóc cây, sẵn sàng hỗ trợ mọi thắc mắc.",
              },
            ].map((value, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                className="group rounded-3xl border border-gray-100 bg-gray-50 p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm transition-transform duration-300 group-hover:scale-110">
                  {value.icon}
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">{value.title}</h3>
                <p className="leading-relaxed text-gray-600">{value.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Call to action */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-primary"></div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="mb-6 text-3xl font-bold text-white md:text-5xl">
              Bạn Đã Sẵn Sàng Thay Đổi Không Gian?
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-green-100">
              Hãy để FengDesk đồng hành cùng bạn tìm ra những mầm xanh mang năng lượng tích cực nhất
              cho ngôi nhà và nơi làm việc.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to="/"
                className="rounded-full bg-white px-8 py-4 font-bold text-green-900 shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-colors hover:bg-gray-100 hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
              >
                Khám Phá Cây Ngay
              </Link>
              <Link
                to="/"
                className="rounded-full border-2 border-white bg-transparent px-8 py-4 font-bold text-white transition-colors hover:bg-white/10"
              >
                Nhận Tư Vấn Phong Thủy
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
