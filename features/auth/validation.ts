export function validateRegistration(value: {
  username: string;
  password: string;
  fullName?: string;
}) {
  if (!/^[A-Za-z0-9_]{3,50}$/.test(value.username))
    return "Tên người dùng cần 3–50 ký tự chữ, số hoặc dấu gạch dưới.";
  if (
    !/^(?=.*[A-Za-z])(?=.*[0-9]).{8,72}$/.test(value.password) ||
    new TextEncoder().encode(value.password).length > 72
  )
    return "Mật khẩu cần 8–72 ký tự, có chữ và số, tối đa 72 byte UTF-8.";
  if (
    value.fullName &&
    (!value.fullName.trim() || [...value.fullName].length > 120)
  )
    return "Họ tên cần 1–120 ký tự, không chỉ chứa khoảng trắng.";
  return "";
}
