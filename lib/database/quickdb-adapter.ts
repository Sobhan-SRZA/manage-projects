import type {
    DBAdapter,
    Where
} from "better-auth/adapters";
import { quickdb } from "./db";

function matchWhere(
    record: Record<string, any>,
    where: Where[]
): boolean {
    return where.every(({ field, value, operator = "eq" }) => {
        const fieldValue = record[field];

        switch (operator) {
            case "eq":
                return fieldValue === value;
            case "ne":
                return fieldValue !== value;
            case "in":
                return Array.isArray(value) && (value as any[]).includes(fieldValue);
            case "not_in":
                return Array.isArray(value) && !(value as any[]).includes(fieldValue);
            case "gt":
                return fieldValue > (value as any);
            case "gte":
                return fieldValue >= (value as any);
            case "lt":
                return fieldValue < (value as any);
            case "lte":
                return fieldValue <= (value as any);
            case "contains":
                return typeof fieldValue === "string" && fieldValue.includes(value as string);
            case "starts_with":
                return typeof fieldValue === "string" && fieldValue.startsWith(value as string);
            case "ends_with":
                return typeof fieldValue === "string" && fieldValue.endsWith(value as string);
            default:
                return false;
        }
    });
}

const tableKey = (table: string) => `ba_${table}`;

export const quickdbAdapter = (): DBAdapter => ({
    id: "quickdb",

    // ---------------- CREATE ----------------
    async create({ model, data, select }) {
        const list = (await quickdb.get(tableKey(model))) ?? [];
        const record = { ...data };
        list.push(record);
        await quickdb.set(tableKey(model), list);
        if (select?.length) {
            return Object.fromEntries(select.map((k) => [k, (record as any)[k]])) as any;
        }
        return record as any;
    },

    // ---------------- FIND ONE ----------------
    async findOne({ model, where, select }) {
        const list = (await quickdb.get(tableKey(model))) ?? [];
        const found = list.find((r: any) => matchWhere(r, where));
        if (!found) return null;
        if (select?.length) {
            return Object.fromEntries(select.map((k) => [k, found[k]])) as any;
        }
        return found;
    },

    // ---------------- FIND MANY ----------------
    async findMany({ model, where, limit, offset, sortBy, select }) {
        let list = (await quickdb.get(tableKey(model))) ?? [];
        if (where?.length) list = list.filter((r: any) => matchWhere(r, where));
        if (sortBy) {
            const { field, direction } = sortBy;
            list.sort((a: any, b: any) => {
                if (a[field] < b[field]) return direction === "asc" ? -1 : 1;
                if (a[field] > b[field]) return direction === "asc" ? 1 : -1;
                return 0;
            });
        }
        if (offset) list = list.slice(offset);
        if (limit) list = list.slice(0, limit);
        if (select?.length) {
            return list.map((r: any) =>
                Object.fromEntries(select.map((k) => [k, r[k]]))
            );
        }
        return list;
    },

    // ---------------- UPDATE ----------------
    async update({ model, where, update }) {
        const list = (await quickdb.get(tableKey(model))) ?? [];
        let updated: any = null;
        const newList = list.map((r: any) => {
            if (matchWhere(r, where)) {
                updated = { ...r, ...update };
                return updated;
            }
            return r;
        });
        if (updated) {
            await quickdb.set(tableKey(model), newList);
            return updated;
        }
        return null;
    },

    // ---------------- UPDATE MANY ----------------
    async updateMany({ model, where, update }) {
        const list = (await quickdb.get(tableKey(model))) ?? [];
        let count = 0;
        const newList = list.map((r: any) => {
            if (matchWhere(r, where)) {
                count++;
                return { ...r, ...update };
            }
            return r;
        });
        await quickdb.set(tableKey(model), newList);
        return count;
    },

    // ---------------- DELETE ----------------
    async delete({ model, where }) {
        const list = (await quickdb.get(tableKey(model))) ?? [];
        await quickdb.set(
            tableKey(model),
            list.filter((r: any) => !matchWhere(r, where))
        );
    },

    // ---------------- DELETE MANY ----------------
    async deleteMany({ model, where }) {
        const list = (await quickdb.get(tableKey(model))) ?? [];
        const filtered = list.filter((r: any) => !matchWhere(r, where));
        await quickdb.set(tableKey(model), filtered);
        return list.length - filtered.length;
    },

    // ---------------- COUNT ----------------
    async count({ model, where }) {
        const list = (await quickdb.get(tableKey(model))) ?? [];
        if (!where?.length) return list.length;
        return list.filter((r: any) => matchWhere(r, where)).length;
    },

    // ---------------- CONSUME ONE ----------------
    // یک رکورد رو پیدا می‌کنه، مقدار فیلد مشخصی رو برمی‌گردونه و (اگه consume=true) رکورد رو حذف/آپدیت می‌کنه
    async consumeOne({ model, where }) {
        const list = (await quickdb.get(tableKey(model))) ?? [];
        const index = list.findIndex((r: any) => matchWhere(r, where));
        if (index === -1) return null;

        const record = list[index];
        // حذف رکورد بعد از مصرف (رفتار پیش‌فرض better-auth)
        list.splice(index, 1);
        await quickdb.set(tableKey(model), list);
        return record;
    },

    // ---------------- INCREMENT ONE ----------------
    // یک فیلد عددی رو به صورت اتمی (در حد امکان) زیاد می‌کنه و رکورد به‌روز رو برمی‌گردونه
    async incrementOne({ model, where, increment }) {
        const list = (await quickdb.get(tableKey(model))) ?? [];
        const index = list.findIndex((r: any) => matchWhere(r, where));
        if (index === -1) return null;

        const record = list[index];
        const updated = { ...record };
        for (const [key, value] of Object.entries(increment)) {
            updated[key] = (updated[key] ?? 0) + (value as number);
        }
        list[index] = updated;
        await quickdb.set(tableKey(model), list);
        return updated;
    },

    // ---------------- TRANSACTION ----------------
    // QuickDB تراکنش واقعی نداره → callback رو با همون adapter اجرا می‌کنیم
    async transaction(callback) {
        return callback(quickdbAdapter());
    },
});