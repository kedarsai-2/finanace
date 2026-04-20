package com.finance.app.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

public class TransferTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2L * Integer.MAX_VALUE));

    public static Transfer getTransferSample1() {
        return new Transfer().id(1L).notes("notes1");
    }

    public static Transfer getTransferSample2() {
        return new Transfer().id(2L).notes("notes2");
    }

    public static Transfer getTransferRandomSampleGenerator() {
        return new Transfer().id(longCount.incrementAndGet()).notes(UUID.randomUUID().toString());
    }
}
