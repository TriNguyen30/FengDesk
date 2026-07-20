import { ArrowLeft, Home } from "lucide-react";
import { Link } from "react-router-dom";
import NotFoundImage from "@/assets/image/404.png";

export default function NotFoundPage() {
    return (
        <main className="flex min-h-[100vh] items-center justify-center bg-white px-4 py-12">
            <div className="flex max-w-2xl flex-col items-center text-center">
                {/* 404 Image */}
                <img
                    src={NotFoundImage}
                    alt="404 - Không tìm thấy trang"
                    className="w-full max-w-[280px] object-contain sm:max-w-[360px]"
                />

                {/* Heading */}
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                    Ôi không! Lạc đường rồi
                </h1>

                {/* Description */}
                <p className="mt-4 max-w-lg text-sm leading-7 text-gray-500 sm:text-base">
                    Trang bạn đang tìm kiếm không tồn tại, đã bị gỡ bỏ hoặc bạn không có
                    quyền truy cập. Hãy quay lại trang chủ để tiếp tục khám phá nhé.
                </p>

                {/* Actions */}
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md"
                    >
                        <Home className="h-4 w-4" />
                        Về Trang Chủ
                    </Link>

                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-600 transition-colors hover:border-primary-light hover:bg-gray-50 hover:text-primary-dark cursor-pointer"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Quay lại
                    </button>
                </div>
            </div>
        </main>
    );
}