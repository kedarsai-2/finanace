package com.finance.app.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

public class PaymentTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2L * Integer.MAX_VALUE));

    public static Payment getPaymentSample1() {
        return new Payment().id(1L).reference("reference1").notes("notes1");
    }

    public static Payment getPaymentSample2() {
        return new Payment().id(2L).reference("reference2").notes("notes2");
    }

    public static Payment getPaymentRandomSampleGenerator() {
        return new Payment().id(longCount.incrementAndGet()).reference(UUID.randomUUID().toString()).notes(UUID.randomUUID().toString());
    }
}
