"""
Проверка надёжности пароля и генератор паролей.
Учебный проект: строки, условия, модули random/string, функции.
"""

import secrets
import string


def check_password(password):
    """Возвращает оценку от 0 до 5 и список советов."""
    tips = []
    score = 0

    if len(password) >= 12:
        score += 2
    elif len(password) >= 8:
        score += 1
        tips.append("Сделайте пароль длиннее — хотя бы 12 символов")
    else:
        tips.append("Пароль слишком короткий (меньше 8 символов)")

    if any(c.islower() for c in password) and any(c.isupper() for c in password):
        score += 1
    else:
        tips.append("Используйте строчные и заглавные буквы")

    if any(c.isdigit() for c in password):
        score += 1
    else:
        tips.append("Добавьте цифры")

    if any(c in string.punctuation for c in password):
        score += 1
    else:
        tips.append("Добавьте спецсимволы: ! @ # $ % и т.д.")

    common = ["123456", "password", "qwerty", "111111", "йцукен"]
    if any(word in password.lower() for word in common):
        score = 0
        tips.insert(0, "Пароль содержит очень распространённую комбинацию")

    return score, tips


def generate_password(length=14):
    """Генерирует пароль, в котором точно есть буквы разных регистров, цифры и спецсимволы."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    while True:
        password = "".join(secrets.choice(alphabet) for _ in range(length))
        if check_password(password)[0] == 5:
            return password


def main():
    labels = ["очень слабый", "слабый", "слабый", "средний", "хороший", "надёжный"]
    while True:
        print("\n1. Проверить пароль\n2. Сгенерировать пароль\n0. Выход")
        choice = input("> ").strip()
        if choice == "1":
            password = input("Введите пароль: ")
            score, tips = check_password(password)
            print(f"Оценка: {score}/5 — {labels[score]}")
            for tip in tips:
                print(f"  • {tip}")
        elif choice == "2":
            length = input("Длина (по умолчанию 14): ").strip()
            length = int(length) if length.isdigit() and 8 <= int(length) <= 64 else 14
            print("Ваш пароль:", generate_password(length))
        elif choice == "0":
            break
        else:
            print("Неизвестная команда.")


if __name__ == "__main__":
    main()
