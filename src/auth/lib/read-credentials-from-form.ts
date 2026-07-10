/**
 * 로그인/회원가입 폼에서 실제 DOM 값을 읽는다.
 *
 * iOS Safari 등은 자동완기로 input을 채워도 React onChange가 안 불릴 수 있다.
 * controlled state만 쓰면 화면에는 값이 보여도 빈/옛 값이 전송된다.
 */
export function readEmailPasswordFromForm(form: HTMLFormElement): {
  email: string;
  password: string;
} {
  const data = new FormData(form);
  return {
    email: String(data.get("email") ?? ""),
    password: String(data.get("password") ?? ""),
  };
}

export function readSignUpFromForm(form: HTMLFormElement): {
  email: string;
  password: string;
  passwordConfirm: string;
} {
  const data = new FormData(form);
  return {
    email: String(data.get("email") ?? ""),
    password: String(data.get("password") ?? ""),
    passwordConfirm: String(data.get("passwordConfirm") ?? ""),
  };
}
