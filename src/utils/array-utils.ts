export abstract class ArrayUtils {
    public static paginate(items: any[], pageSize: number, pageNumber: number): any[] {
        // Human-readable page numbers start with 1, so reduce 1 in the first argument
        return items.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
    }
}
