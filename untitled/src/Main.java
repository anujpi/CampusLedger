import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.Predicate;

public class Main {
    public static void main(String[] args) {
        Function<Integer , Integer> doubleIt = x->2 * x;
        Function<Integer , Integer> triple = x->3 * x;
        System.out.println(doubleIt.andThen(triple).apply(20));
        System.out.println(doubleIt.compose(triple).apply(20));
        Function<Integer, Integer> identity = Function.identity();
        identity.apply(5);
        Consumer<Integer> consumer = System.out::println;

    }
}