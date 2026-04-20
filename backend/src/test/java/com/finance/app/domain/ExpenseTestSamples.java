package com.finance.app.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

public class ExpenseTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2L * Integer.MAX_VALUE));

    public static Expense getExpenseSample1() {
        return new Expense().id(1L).category("category1").reference("reference1").notes("notes1");
    }

    public static Expense getExpenseSample2() {
        return new Expense().id(2L).category("category2").reference("reference2").notes("notes2");
    }

    public static Expense getExpenseRandomSampleGenerator() {
        return new Expense()
            .id(longCount.incrementAndGet())
            .category(UUID.randomUUID().toString())
            .reference(UUID.randomUUID().toString())
            .notes(UUID.randomUUID().toString());
    }
}
