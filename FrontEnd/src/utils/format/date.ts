export function formatTimeAgo(isoDate: string): string {
  if (!isoDate)
    return "";
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffH < 24) {
    if (diffH >= 1) {
      return `${diffH} giờ trước`;
    }
    if (diffMin >= 1) {
      return `${diffMin} phút trước`;
    }
    return `Vừa xong`;
  }

  if (diffD < 7) {
    return `${diffD} ngày trước`;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
