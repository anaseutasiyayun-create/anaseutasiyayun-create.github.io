"""
Учёт расходов в консоли.
Учебный проект по основам Python: функции, списки, словари, циклы,
обработка ошибок и сохранение данных в JSON-файл.
"""

import json
import os
from datetime import date

DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "expenses.json")
CATEGORIES = ["Еда", "Транспорт", "Учёба", "Развлечения", "Другое"]


def load_expenses():
    """Читает расходы из файла. Если файла нет — возвращает пустой список."""
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        print("Не удалось прочитать файл с данными, начинаем с пустого списка.")
        return []


def save_expenses(expenses):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(expenses, f, ensure_ascii=False, indent=2)


def ask_amount():
    """Спрашивает сумму, пока пользователь не введёт положительное число."""
    while True:
        raw = input("Сумма, ₽: ").replace(",", ".").strip()
        try:
            amount = float(raw)
            if amount <= 0:
                print("Сумма должна быть больше нуля.")
                continue
            return round(amount, 2)
        except ValueError:
            print("Введите число, например 350 или 99.90")


def ask_category():
    for i, name in enumerate(CATEGORIES, start=1):
        print(f"  {i}. {name}")
    while True:
        choice = input("Номер категории: ").strip()
        if choice.isdigit() and 1 <= int(choice) <= len(CATEGORIES):
            return CATEGORIES[int(choice) - 1]
        print(f"Введите число от 1 до {len(CATEGORIES)}")


def add_expense(expenses):
    amount = ask_amount()
    category = ask_category()
    comment = input("Комментарий (можно пропустить): ").strip()
    expenses.append({
        "date": date.today().isoformat(),
        "amount": amount,
        "category": category,
        "comment": comment,
    })
    save_expenses(expenses)
    print(f"✓ Добавлено: {amount:.2f} ₽ — {category}")


def show_expenses(expenses):
    if not expenses:
        print("Расходов пока нет.")
        return
    print(f"\n{'№':<4}{'Дата':<12}{'Сумма':>10}  {'Категория':<14}Комментарий")
    print("-" * 60)
    for i, e in enumerate(expenses, start=1):
        print(f"{i:<4}{e['date']:<12}{e['amount']:>10.2f}  {e['category']:<14}{e['comment']}")


def show_stats(expenses):
    if not expenses:
        print("Нет данных для статистики.")
        return
    total = sum(e["amount"] for e in expenses)
    by_category = {}
    for e in expenses:
        by_category[e["category"]] = by_category.get(e["category"], 0) + e["amount"]

    print(f"\nВсего потрачено: {total:.2f} ₽")
    print(f"Средний расход: {total / len(expenses):.2f} ₽\n")
    for name, value in sorted(by_category.items(), key=lambda item: item[1], reverse=True):
        percent = value / total * 100
        bar = "█" * round(percent / 4)
        print(f"{name:<14}{value:>10.2f} ₽ {percent:5.1f}% {bar}")


def delete_expense(expenses):
    show_expenses(expenses)
    if not expenses:
        return
    choice = input("Номер записи для удаления (Enter — отмена): ").strip()
    if choice.isdigit() and 1 <= int(choice) <= len(expenses):
        removed = expenses.pop(int(choice) - 1)
        save_expenses(expenses)
        print(f"✓ Удалено: {removed['amount']:.2f} ₽ — {removed['category']}")
    elif choice:
        print("Нет записи с таким номером.")


def main():
    expenses = load_expenses()
    actions = {
        "1": ("Добавить расход", add_expense),
        "2": ("Показать все расходы", show_expenses),
        "3": ("Статистика по категориям", show_stats),
        "4": ("Удалить запись", delete_expense),
    }
    while True:
        print("\n=== Учёт расходов ===")
        for key, (title, _) in actions.items():
            print(f"{key}. {title}")
        print("0. Выход")
        choice = input("> ").strip()
        if choice == "0":
            print("До встречи!")
            break
        if choice in actions:
            actions[choice][1](expenses)
        else:
            print("Неизвестная команда.")


if __name__ == "__main__":
    main()
