package com.finance.app.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

public class InvoiceLineTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2L * Integer.MAX_VALUE));
    private static final AtomicInteger intCount = new AtomicInteger(random.nextInt() + (2 * Short.MAX_VALUE));

    public static InvoiceLine getInvoiceLineSample1() {
        return new InvoiceLine().id(1L).name("name1").unit("unit1").lineOrder(1);
    }

    public static InvoiceLine getInvoiceLineSample2() {
        return new InvoiceLine().id(2L).name("name2").unit("unit2").lineOrder(2);
    }

    public static InvoiceLine getInvoiceLineRandomSampleGenerator() {
        return new InvoiceLine()
            .id(longCount.incrementAndGet())
            .name(UUID.randomUUID().toString())
            .unit(UUID.randomUUID().toString())
            .lineOrder(intCount.incrementAndGet());
    }
}
