package com.finance.app.domain;

import java.util.Random;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

public class ItemTestSamples {

    private static final Random random = new Random();
    private static final AtomicLong longCount = new AtomicLong(random.nextInt() + (2L * Integer.MAX_VALUE));

    public static Item getItemSample1() {
        return new Item().id(1L).name("name1").sku("sku1").type("type1").unit("unit1").description("description1");
    }

    public static Item getItemSample2() {
        return new Item().id(2L).name("name2").sku("sku2").type("type2").unit("unit2").description("description2");
    }

    public static Item getItemRandomSampleGenerator() {
        return new Item()
            .id(longCount.incrementAndGet())
            .name(UUID.randomUUID().toString())
            .sku(UUID.randomUUID().toString())
            .type(UUID.randomUUID().toString())
            .unit(UUID.randomUUID().toString())
            .description(UUID.randomUUID().toString());
    }
}
