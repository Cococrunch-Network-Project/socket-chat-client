/** จำนวนข้อความที่ยังไม่อ่าน */
export default function UnreadBadge({ count }: { count?: number }) {
  if (!count) return null;
  return (
    <span className="ml-auto min-w-5 rounded-full bg-red-500 px-1.5 text-center text-xs font-semibold leading-5 text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}
