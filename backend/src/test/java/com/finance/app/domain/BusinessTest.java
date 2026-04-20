package com.finance.app.domain;

import static com.finance.app.domain.BusinessTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.finance.app.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class BusinessTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Business.class);
        Business business1 = getBusinessSample1();
        Business business2 = new Business();
        assertThat(business1).isNotEqualTo(business2);

        business2.setId(business1.getId());
        assertThat(business1).isEqualTo(business2);

        business2 = getBusinessSample2();
        assertThat(business1).isNotEqualTo(business2);
    }
}
