package com.finance.app.domain;

import static com.finance.app.domain.BusinessTestSamples.*;
import static com.finance.app.domain.ItemTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.finance.app.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class ItemTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Item.class);
        Item item1 = getItemSample1();
        Item item2 = new Item();
        assertThat(item1).isNotEqualTo(item2);

        item2.setId(item1.getId());
        assertThat(item1).isEqualTo(item2);

        item2 = getItemSample2();
        assertThat(item1).isNotEqualTo(item2);
    }

    @Test
    void businessTest() {
        Item item = getItemRandomSampleGenerator();
        Business businessBack = getBusinessRandomSampleGenerator();

        item.setBusiness(businessBack);
        assertThat(item.getBusiness()).isEqualTo(businessBack);

        item.business(null);
        assertThat(item.getBusiness()).isNull();
    }
}
