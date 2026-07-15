import FengDesk from "@/assets/image/fengdesk_logo_2.png";

export default function FooterManager() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row text-xs text-gray-500">
        <p className="flex items-center gap-1">
          &copy; {currentYear} <img src={FengDesk} alt="FengDesk" className="h-6 w-6" />{" "}
          <span className="font-medium text-gray-700">FengDesk AI</span>. All rights reserved.
        </p>
        <p>Phiên bản 1.0.0</p>
      </div>
    </footer>
  );
}
