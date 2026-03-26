export type AdminLoginState = {
  ok: boolean;
  message: string;
};

export async function adminLogin(
  _prev: AdminLoginState,
  _formData: FormData,
): Promise<AdminLoginState> {
  void _prev;
  void _formData;
  return { ok: false, message: "Frontend-only mode: admin login is disabled." };
}

export async function adminLogout(): Promise<void> {
  return;
}

