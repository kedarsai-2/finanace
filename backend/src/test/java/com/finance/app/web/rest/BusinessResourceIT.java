package com.finance.app.web.rest;

import static com.finance.app.domain.BusinessAsserts.*;
import static com.finance.app.web.rest.TestUtil.createUpdateProxyForBean;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.app.IntegrationTest;
import com.finance.app.domain.Business;
import com.finance.app.repository.BusinessRepository;
import com.finance.app.service.dto.BusinessDTO;
import com.finance.app.service.mapper.BusinessMapper;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Random;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for the {@link BusinessResource} REST controller.
 */
@IntegrationTest
@AutoConfigureMockMvc
@WithMockUser
class BusinessResourceIT {

    private static final String DEFAULT_NAME = "AAAAAAAAAA";
    private static final String UPDATED_NAME = "BBBBBBBBBB";

    private static final String DEFAULT_OWNER_NAME = "AAAAAAAAAA";
    private static final String UPDATED_OWNER_NAME = "BBBBBBBBBB";

    private static final String DEFAULT_MOBILE = "6375816271";
    private static final String UPDATED_MOBILE = "7004354928";

    private static final String DEFAULT_EMAIL = "AAAAAAAAAA";
    private static final String UPDATED_EMAIL = "BBBBBBBBBB";

    private static final String DEFAULT_LOGO_URL = "AAAAAAAAAA";
    private static final String UPDATED_LOGO_URL = "BBBBBBBBBB";

    private static final String DEFAULT_GST_NUMBER = "59BOYMC4492C4Z8";
    private static final String UPDATED_GST_NUMBER = "57GKBNB7907LNZQ";

    private static final String DEFAULT_PAN_NUMBER = "TPICF7969L";
    private static final String UPDATED_PAN_NUMBER = "WAAEK9489S";

    private static final String DEFAULT_CITY = "AAAAAAAAAA";
    private static final String UPDATED_CITY = "BBBBBBBBBB";

    private static final String DEFAULT_STATE = "AAAAAAAAAA";
    private static final String UPDATED_STATE = "BBBBBBBBBB";

    private static final String DEFAULT_BILLING_LINE_1 = "AAAAAAAAAA";
    private static final String UPDATED_BILLING_LINE_1 = "BBBBBBBBBB";

    private static final String DEFAULT_BILLING_LINE_2 = "AAAAAAAAAA";
    private static final String UPDATED_BILLING_LINE_2 = "BBBBBBBBBB";

    private static final String DEFAULT_BILLING_CITY = "AAAAAAAAAA";
    private static final String UPDATED_BILLING_CITY = "BBBBBBBBBB";

    private static final String DEFAULT_BILLING_STATE = "AAAAAAAAAA";
    private static final String UPDATED_BILLING_STATE = "BBBBBBBBBB";

    private static final String DEFAULT_BILLING_PINCODE = "309007";
    private static final String UPDATED_BILLING_PINCODE = "327571";

    private static final String DEFAULT_SHIPPING_LINE_1 = "AAAAAAAAAA";
    private static final String UPDATED_SHIPPING_LINE_1 = "BBBBBBBBBB";

    private static final String DEFAULT_SHIPPING_LINE_2 = "AAAAAAAAAA";
    private static final String UPDATED_SHIPPING_LINE_2 = "BBBBBBBBBB";

    private static final String DEFAULT_SHIPPING_CITY = "AAAAAAAAAA";
    private static final String UPDATED_SHIPPING_CITY = "BBBBBBBBBB";

    private static final String DEFAULT_SHIPPING_STATE = "AAAAAAAAAA";
    private static final String UPDATED_SHIPPING_STATE = "BBBBBBBBBB";

    private static final String DEFAULT_SHIPPING_PINCODE = "168726";
    private static final String UPDATED_SHIPPING_PINCODE = "659275";

    private static final Boolean DEFAULT_SHIPPING_SAME_AS_BILLING = false;
    private static final Boolean UPDATED_SHIPPING_SAME_AS_BILLING = true;

    private static final String DEFAULT_CURRENCY = "AAA";
    private static final String UPDATED_CURRENCY = "BBB";

    private static final Integer DEFAULT_FY_START_MONTH = 1;
    private static final Integer UPDATED_FY_START_MONTH = 2;

    private static final Boolean DEFAULT_HAS_DATA = false;
    private static final Boolean UPDATED_HAS_DATA = true;

    private static final Instant DEFAULT_CREATED_AT = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_CREATED_AT = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final Instant DEFAULT_UPDATED_AT = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_UPDATED_AT = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final String ENTITY_API_URL = "/api/businesses";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2L * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private BusinessRepository businessRepository;

    @Autowired
    private BusinessMapper businessMapper;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restBusinessMockMvc;

    private Business business;

    private Business insertedBusiness;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Business createEntity() {
        return new Business()
            .name(DEFAULT_NAME)
            .ownerName(DEFAULT_OWNER_NAME)
            .mobile(DEFAULT_MOBILE)
            .email(DEFAULT_EMAIL)
            .logoUrl(DEFAULT_LOGO_URL)
            .gstNumber(DEFAULT_GST_NUMBER)
            .panNumber(DEFAULT_PAN_NUMBER)
            .city(DEFAULT_CITY)
            .state(DEFAULT_STATE)
            .billingLine1(DEFAULT_BILLING_LINE_1)
            .billingLine2(DEFAULT_BILLING_LINE_2)
            .billingCity(DEFAULT_BILLING_CITY)
            .billingState(DEFAULT_BILLING_STATE)
            .billingPincode(DEFAULT_BILLING_PINCODE)
            .shippingLine1(DEFAULT_SHIPPING_LINE_1)
            .shippingLine2(DEFAULT_SHIPPING_LINE_2)
            .shippingCity(DEFAULT_SHIPPING_CITY)
            .shippingState(DEFAULT_SHIPPING_STATE)
            .shippingPincode(DEFAULT_SHIPPING_PINCODE)
            .shippingSameAsBilling(DEFAULT_SHIPPING_SAME_AS_BILLING)
            .currency(DEFAULT_CURRENCY)
            .fyStartMonth(DEFAULT_FY_START_MONTH)
            .hasData(DEFAULT_HAS_DATA)
            .createdAt(DEFAULT_CREATED_AT)
            .updatedAt(DEFAULT_UPDATED_AT);
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Business createUpdatedEntity() {
        return new Business()
            .name(UPDATED_NAME)
            .ownerName(UPDATED_OWNER_NAME)
            .mobile(UPDATED_MOBILE)
            .email(UPDATED_EMAIL)
            .logoUrl(UPDATED_LOGO_URL)
            .gstNumber(UPDATED_GST_NUMBER)
            .panNumber(UPDATED_PAN_NUMBER)
            .city(UPDATED_CITY)
            .state(UPDATED_STATE)
            .billingLine1(UPDATED_BILLING_LINE_1)
            .billingLine2(UPDATED_BILLING_LINE_2)
            .billingCity(UPDATED_BILLING_CITY)
            .billingState(UPDATED_BILLING_STATE)
            .billingPincode(UPDATED_BILLING_PINCODE)
            .shippingLine1(UPDATED_SHIPPING_LINE_1)
            .shippingLine2(UPDATED_SHIPPING_LINE_2)
            .shippingCity(UPDATED_SHIPPING_CITY)
            .shippingState(UPDATED_SHIPPING_STATE)
            .shippingPincode(UPDATED_SHIPPING_PINCODE)
            .shippingSameAsBilling(UPDATED_SHIPPING_SAME_AS_BILLING)
            .currency(UPDATED_CURRENCY)
            .fyStartMonth(UPDATED_FY_START_MONTH)
            .hasData(UPDATED_HAS_DATA)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT);
    }

    @BeforeEach
    void initTest() {
        business = createEntity();
    }

    @AfterEach
    void cleanup() {
        if (insertedBusiness != null) {
            businessRepository.delete(insertedBusiness);
            insertedBusiness = null;
        }
    }

    @Test
    @Transactional
    void createBusiness() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the Business
        BusinessDTO businessDTO = businessMapper.toDto(business);
        var returnedBusinessDTO = om.readValue(
            restBusinessMockMvc
                .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(businessDTO)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            BusinessDTO.class
        );

        // Validate the Business in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedBusiness = businessMapper.toEntity(returnedBusinessDTO);
        assertBusinessUpdatableFieldsEquals(returnedBusiness, getPersistedBusiness(returnedBusiness));

        insertedBusiness = returnedBusiness;
    }

    @Test
    @Transactional
    void createBusinessWithExistingId() throws Exception {
        // Create the Business with an existing ID
        business.setId(1L);
        BusinessDTO businessDTO = businessMapper.toDto(business);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restBusinessMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(businessDTO)))
            .andExpect(status().isBadRequest());

        // Validate the Business in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkNameIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        business.setName(null);

        // Create the Business, which fails.
        BusinessDTO businessDTO = businessMapper.toDto(business);

        restBusinessMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(businessDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkMobileIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        business.setMobile(null);

        // Create the Business, which fails.
        BusinessDTO businessDTO = businessMapper.toDto(business);

        restBusinessMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(businessDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkCityIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        business.setCity(null);

        // Create the Business, which fails.
        BusinessDTO businessDTO = businessMapper.toDto(business);

        restBusinessMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(businessDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkStateIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        business.setState(null);

        // Create the Business, which fails.
        BusinessDTO businessDTO = businessMapper.toDto(business);

        restBusinessMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(businessDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkCreatedAtIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        business.setCreatedAt(null);

        // Create the Business, which fails.
        BusinessDTO businessDTO = businessMapper.toDto(business);

        restBusinessMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(businessDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllBusinesses() throws Exception {
        // Initialize the database
        insertedBusiness = businessRepository.saveAndFlush(business);

        // Get all the businessList
        restBusinessMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(business.getId().intValue())))
            .andExpect(jsonPath("$.[*].name").value(hasItem(DEFAULT_NAME)))
            .andExpect(jsonPath("$.[*].ownerName").value(hasItem(DEFAULT_OWNER_NAME)))
            .andExpect(jsonPath("$.[*].mobile").value(hasItem(DEFAULT_MOBILE)))
            .andExpect(jsonPath("$.[*].email").value(hasItem(DEFAULT_EMAIL)))
            .andExpect(jsonPath("$.[*].logoUrl").value(hasItem(DEFAULT_LOGO_URL)))
            .andExpect(jsonPath("$.[*].gstNumber").value(hasItem(DEFAULT_GST_NUMBER)))
            .andExpect(jsonPath("$.[*].panNumber").value(hasItem(DEFAULT_PAN_NUMBER)))
            .andExpect(jsonPath("$.[*].city").value(hasItem(DEFAULT_CITY)))
            .andExpect(jsonPath("$.[*].state").value(hasItem(DEFAULT_STATE)))
            .andExpect(jsonPath("$.[*].billingLine1").value(hasItem(DEFAULT_BILLING_LINE_1)))
            .andExpect(jsonPath("$.[*].billingLine2").value(hasItem(DEFAULT_BILLING_LINE_2)))
            .andExpect(jsonPath("$.[*].billingCity").value(hasItem(DEFAULT_BILLING_CITY)))
            .andExpect(jsonPath("$.[*].billingState").value(hasItem(DEFAULT_BILLING_STATE)))
            .andExpect(jsonPath("$.[*].billingPincode").value(hasItem(DEFAULT_BILLING_PINCODE)))
            .andExpect(jsonPath("$.[*].shippingLine1").value(hasItem(DEFAULT_SHIPPING_LINE_1)))
            .andExpect(jsonPath("$.[*].shippingLine2").value(hasItem(DEFAULT_SHIPPING_LINE_2)))
            .andExpect(jsonPath("$.[*].shippingCity").value(hasItem(DEFAULT_SHIPPING_CITY)))
            .andExpect(jsonPath("$.[*].shippingState").value(hasItem(DEFAULT_SHIPPING_STATE)))
            .andExpect(jsonPath("$.[*].shippingPincode").value(hasItem(DEFAULT_SHIPPING_PINCODE)))
            .andExpect(jsonPath("$.[*].shippingSameAsBilling").value(hasItem(DEFAULT_SHIPPING_SAME_AS_BILLING)))
            .andExpect(jsonPath("$.[*].currency").value(hasItem(DEFAULT_CURRENCY)))
            .andExpect(jsonPath("$.[*].fyStartMonth").value(hasItem(DEFAULT_FY_START_MONTH)))
            .andExpect(jsonPath("$.[*].hasData").value(hasItem(DEFAULT_HAS_DATA)))
            .andExpect(jsonPath("$.[*].createdAt").value(hasItem(DEFAULT_CREATED_AT.toString())))
            .andExpect(jsonPath("$.[*].updatedAt").value(hasItem(DEFAULT_UPDATED_AT.toString())));
    }

    @Test
    @Transactional
    void getBusiness() throws Exception {
        // Initialize the database
        insertedBusiness = businessRepository.saveAndFlush(business);

        // Get the business
        restBusinessMockMvc
            .perform(get(ENTITY_API_URL_ID, business.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(business.getId().intValue()))
            .andExpect(jsonPath("$.name").value(DEFAULT_NAME))
            .andExpect(jsonPath("$.ownerName").value(DEFAULT_OWNER_NAME))
            .andExpect(jsonPath("$.mobile").value(DEFAULT_MOBILE))
            .andExpect(jsonPath("$.email").value(DEFAULT_EMAIL))
            .andExpect(jsonPath("$.logoUrl").value(DEFAULT_LOGO_URL))
            .andExpect(jsonPath("$.gstNumber").value(DEFAULT_GST_NUMBER))
            .andExpect(jsonPath("$.panNumber").value(DEFAULT_PAN_NUMBER))
            .andExpect(jsonPath("$.city").value(DEFAULT_CITY))
            .andExpect(jsonPath("$.state").value(DEFAULT_STATE))
            .andExpect(jsonPath("$.billingLine1").value(DEFAULT_BILLING_LINE_1))
            .andExpect(jsonPath("$.billingLine2").value(DEFAULT_BILLING_LINE_2))
            .andExpect(jsonPath("$.billingCity").value(DEFAULT_BILLING_CITY))
            .andExpect(jsonPath("$.billingState").value(DEFAULT_BILLING_STATE))
            .andExpect(jsonPath("$.billingPincode").value(DEFAULT_BILLING_PINCODE))
            .andExpect(jsonPath("$.shippingLine1").value(DEFAULT_SHIPPING_LINE_1))
            .andExpect(jsonPath("$.shippingLine2").value(DEFAULT_SHIPPING_LINE_2))
            .andExpect(jsonPath("$.shippingCity").value(DEFAULT_SHIPPING_CITY))
            .andExpect(jsonPath("$.shippingState").value(DEFAULT_SHIPPING_STATE))
            .andExpect(jsonPath("$.shippingPincode").value(DEFAULT_SHIPPING_PINCODE))
            .andExpect(jsonPath("$.shippingSameAsBilling").value(DEFAULT_SHIPPING_SAME_AS_BILLING))
            .andExpect(jsonPath("$.currency").value(DEFAULT_CURRENCY))
            .andExpect(jsonPath("$.fyStartMonth").value(DEFAULT_FY_START_MONTH))
            .andExpect(jsonPath("$.hasData").value(DEFAULT_HAS_DATA))
            .andExpect(jsonPath("$.createdAt").value(DEFAULT_CREATED_AT.toString()))
            .andExpect(jsonPath("$.updatedAt").value(DEFAULT_UPDATED_AT.toString()));
    }

    @Test
    @Transactional
    void getNonExistingBusiness() throws Exception {
        // Get the business
        restBusinessMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingBusiness() throws Exception {
        // Initialize the database
        insertedBusiness = businessRepository.saveAndFlush(business);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the business
        Business updatedBusiness = businessRepository.findById(business.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedBusiness are not directly saved in db
        em.detach(updatedBusiness);
        updatedBusiness
            .name(UPDATED_NAME)
            .ownerName(UPDATED_OWNER_NAME)
            .mobile(UPDATED_MOBILE)
            .email(UPDATED_EMAIL)
            .logoUrl(UPDATED_LOGO_URL)
            .gstNumber(UPDATED_GST_NUMBER)
            .panNumber(UPDATED_PAN_NUMBER)
            .city(UPDATED_CITY)
            .state(UPDATED_STATE)
            .billingLine1(UPDATED_BILLING_LINE_1)
            .billingLine2(UPDATED_BILLING_LINE_2)
            .billingCity(UPDATED_BILLING_CITY)
            .billingState(UPDATED_BILLING_STATE)
            .billingPincode(UPDATED_BILLING_PINCODE)
            .shippingLine1(UPDATED_SHIPPING_LINE_1)
            .shippingLine2(UPDATED_SHIPPING_LINE_2)
            .shippingCity(UPDATED_SHIPPING_CITY)
            .shippingState(UPDATED_SHIPPING_STATE)
            .shippingPincode(UPDATED_SHIPPING_PINCODE)
            .shippingSameAsBilling(UPDATED_SHIPPING_SAME_AS_BILLING)
            .currency(UPDATED_CURRENCY)
            .fyStartMonth(UPDATED_FY_START_MONTH)
            .hasData(UPDATED_HAS_DATA)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT);
        BusinessDTO businessDTO = businessMapper.toDto(updatedBusiness);

        restBusinessMockMvc
            .perform(
                put(ENTITY_API_URL_ID, businessDTO.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(businessDTO))
            )
            .andExpect(status().isOk());

        // Validate the Business in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedBusinessToMatchAllProperties(updatedBusiness);
    }

    @Test
    @Transactional
    void putNonExistingBusiness() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        business.setId(longCount.incrementAndGet());

        // Create the Business
        BusinessDTO businessDTO = businessMapper.toDto(business);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restBusinessMockMvc
            .perform(
                put(ENTITY_API_URL_ID, businessDTO.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(businessDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Business in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchBusiness() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        business.setId(longCount.incrementAndGet());

        // Create the Business
        BusinessDTO businessDTO = businessMapper.toDto(business);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restBusinessMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(businessDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Business in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamBusiness() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        business.setId(longCount.incrementAndGet());

        // Create the Business
        BusinessDTO businessDTO = businessMapper.toDto(business);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restBusinessMockMvc
            .perform(put(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(businessDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Business in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdateBusinessWithPatch() throws Exception {
        // Initialize the database
        insertedBusiness = businessRepository.saveAndFlush(business);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the business using partial update
        Business partialUpdatedBusiness = new Business();
        partialUpdatedBusiness.setId(business.getId());

        partialUpdatedBusiness
            .mobile(UPDATED_MOBILE)
            .email(UPDATED_EMAIL)
            .panNumber(UPDATED_PAN_NUMBER)
            .state(UPDATED_STATE)
            .billingLine1(UPDATED_BILLING_LINE_1)
            .billingLine2(UPDATED_BILLING_LINE_2)
            .billingState(UPDATED_BILLING_STATE)
            .hasData(UPDATED_HAS_DATA)
            .updatedAt(UPDATED_UPDATED_AT);

        restBusinessMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedBusiness.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedBusiness))
            )
            .andExpect(status().isOk());

        // Validate the Business in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertBusinessUpdatableFieldsEquals(createUpdateProxyForBean(partialUpdatedBusiness, business), getPersistedBusiness(business));
    }

    @Test
    @Transactional
    void fullUpdateBusinessWithPatch() throws Exception {
        // Initialize the database
        insertedBusiness = businessRepository.saveAndFlush(business);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the business using partial update
        Business partialUpdatedBusiness = new Business();
        partialUpdatedBusiness.setId(business.getId());

        partialUpdatedBusiness
            .name(UPDATED_NAME)
            .ownerName(UPDATED_OWNER_NAME)
            .mobile(UPDATED_MOBILE)
            .email(UPDATED_EMAIL)
            .logoUrl(UPDATED_LOGO_URL)
            .gstNumber(UPDATED_GST_NUMBER)
            .panNumber(UPDATED_PAN_NUMBER)
            .city(UPDATED_CITY)
            .state(UPDATED_STATE)
            .billingLine1(UPDATED_BILLING_LINE_1)
            .billingLine2(UPDATED_BILLING_LINE_2)
            .billingCity(UPDATED_BILLING_CITY)
            .billingState(UPDATED_BILLING_STATE)
            .billingPincode(UPDATED_BILLING_PINCODE)
            .shippingLine1(UPDATED_SHIPPING_LINE_1)
            .shippingLine2(UPDATED_SHIPPING_LINE_2)
            .shippingCity(UPDATED_SHIPPING_CITY)
            .shippingState(UPDATED_SHIPPING_STATE)
            .shippingPincode(UPDATED_SHIPPING_PINCODE)
            .shippingSameAsBilling(UPDATED_SHIPPING_SAME_AS_BILLING)
            .currency(UPDATED_CURRENCY)
            .fyStartMonth(UPDATED_FY_START_MONTH)
            .hasData(UPDATED_HAS_DATA)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT);

        restBusinessMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedBusiness.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedBusiness))
            )
            .andExpect(status().isOk());

        // Validate the Business in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertBusinessUpdatableFieldsEquals(partialUpdatedBusiness, getPersistedBusiness(partialUpdatedBusiness));
    }

    @Test
    @Transactional
    void patchNonExistingBusiness() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        business.setId(longCount.incrementAndGet());

        // Create the Business
        BusinessDTO businessDTO = businessMapper.toDto(business);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restBusinessMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, businessDTO.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(businessDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Business in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchBusiness() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        business.setId(longCount.incrementAndGet());

        // Create the Business
        BusinessDTO businessDTO = businessMapper.toDto(business);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restBusinessMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(businessDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Business in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamBusiness() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        business.setId(longCount.incrementAndGet());

        // Create the Business
        BusinessDTO businessDTO = businessMapper.toDto(business);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restBusinessMockMvc
            .perform(patch(ENTITY_API_URL).contentType("application/merge-patch+json").content(om.writeValueAsBytes(businessDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Business in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteBusiness() throws Exception {
        // Initialize the database
        insertedBusiness = businessRepository.saveAndFlush(business);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the business
        restBusinessMockMvc
            .perform(delete(ENTITY_API_URL_ID, business.getId()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return businessRepository.count();
    }

    protected void assertIncrementedRepositoryCount(long countBefore) {
        assertThat(countBefore + 1).isEqualTo(getRepositoryCount());
    }

    protected void assertDecrementedRepositoryCount(long countBefore) {
        assertThat(countBefore - 1).isEqualTo(getRepositoryCount());
    }

    protected void assertSameRepositoryCount(long countBefore) {
        assertThat(countBefore).isEqualTo(getRepositoryCount());
    }

    protected Business getPersistedBusiness(Business business) {
        return businessRepository.findById(business.getId()).orElseThrow();
    }

    protected void assertPersistedBusinessToMatchAllProperties(Business expectedBusiness) {
        assertBusinessAllPropertiesEquals(expectedBusiness, getPersistedBusiness(expectedBusiness));
    }

    protected void assertPersistedBusinessToMatchUpdatableProperties(Business expectedBusiness) {
        assertBusinessAllUpdatablePropertiesEquals(expectedBusiness, getPersistedBusiness(expectedBusiness));
    }
}
