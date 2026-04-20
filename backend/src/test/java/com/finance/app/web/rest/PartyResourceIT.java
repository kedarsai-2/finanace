package com.finance.app.web.rest;

import static com.finance.app.domain.PartyAsserts.*;
import static com.finance.app.web.rest.TestUtil.createUpdateProxyForBean;
import static com.finance.app.web.rest.TestUtil.sameNumber;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.app.IntegrationTest;
import com.finance.app.domain.Business;
import com.finance.app.domain.Party;
import com.finance.app.domain.enumeration.PartyType;
import com.finance.app.repository.PartyRepository;
import com.finance.app.service.PartyService;
import com.finance.app.service.dto.PartyDTO;
import com.finance.app.service.mapper.PartyMapper;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Random;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for the {@link PartyResource} REST controller.
 */
@IntegrationTest
@ExtendWith(MockitoExtension.class)
@AutoConfigureMockMvc
@WithMockUser
class PartyResourceIT {

    private static final String DEFAULT_NAME = "AAAAAAAAAA";
    private static final String UPDATED_NAME = "BBBBBBBBBB";

    private static final PartyType DEFAULT_TYPE = PartyType.CUSTOMER;
    private static final PartyType UPDATED_TYPE = PartyType.SUPPLIER;

    private static final String DEFAULT_MOBILE = "9337566318";
    private static final String UPDATED_MOBILE = "9765589022";

    private static final String DEFAULT_EMAIL = "AAAAAAAAAA";
    private static final String UPDATED_EMAIL = "BBBBBBBBBB";

    private static final String DEFAULT_ADDRESS_LINE_1 = "AAAAAAAAAA";
    private static final String UPDATED_ADDRESS_LINE_1 = "BBBBBBBBBB";

    private static final String DEFAULT_ADDRESS_CITY = "AAAAAAAAAA";
    private static final String UPDATED_ADDRESS_CITY = "BBBBBBBBBB";

    private static final String DEFAULT_ADDRESS_STATE = "AAAAAAAAAA";
    private static final String UPDATED_ADDRESS_STATE = "BBBBBBBBBB";

    private static final String DEFAULT_ADDRESS_PINCODE = "362085";
    private static final String UPDATED_ADDRESS_PINCODE = "474000";

    private static final String DEFAULT_GST_NUMBER = "43ITFFW3815ZTZC";
    private static final String UPDATED_GST_NUMBER = "53DOBTJ3341U3ZO";

    private static final String DEFAULT_PAN_NUMBER = "IOCIO0231B";
    private static final String UPDATED_PAN_NUMBER = "MCRJD2692A";

    private static final BigDecimal DEFAULT_CREDIT_LIMIT = new BigDecimal(0);
    private static final BigDecimal UPDATED_CREDIT_LIMIT = new BigDecimal(1);
    private static final BigDecimal SMALLER_CREDIT_LIMIT = new BigDecimal(0 - 1);

    private static final Integer DEFAULT_PAYMENT_TERMS_DAYS = 0;
    private static final Integer UPDATED_PAYMENT_TERMS_DAYS = 1;
    private static final Integer SMALLER_PAYMENT_TERMS_DAYS = 0 - 1;

    private static final BigDecimal DEFAULT_OPENING_BALANCE = new BigDecimal(1);
    private static final BigDecimal UPDATED_OPENING_BALANCE = new BigDecimal(2);
    private static final BigDecimal SMALLER_OPENING_BALANCE = new BigDecimal(1 - 1);

    private static final BigDecimal DEFAULT_BALANCE = new BigDecimal(1);
    private static final BigDecimal UPDATED_BALANCE = new BigDecimal(2);
    private static final BigDecimal SMALLER_BALANCE = new BigDecimal(1 - 1);

    private static final Instant DEFAULT_CREATED_AT = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_CREATED_AT = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final Instant DEFAULT_UPDATED_AT = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_UPDATED_AT = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final Boolean DEFAULT_DELETED = false;
    private static final Boolean UPDATED_DELETED = true;

    private static final String ENTITY_API_URL = "/api/parties";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2L * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private PartyRepository partyRepository;

    @Mock
    private PartyRepository partyRepositoryMock;

    @Autowired
    private PartyMapper partyMapper;

    @Mock
    private PartyService partyServiceMock;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restPartyMockMvc;

    private Party party;

    private Party insertedParty;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Party createEntity() {
        return new Party()
            .name(DEFAULT_NAME)
            .type(DEFAULT_TYPE)
            .mobile(DEFAULT_MOBILE)
            .email(DEFAULT_EMAIL)
            .addressLine1(DEFAULT_ADDRESS_LINE_1)
            .addressCity(DEFAULT_ADDRESS_CITY)
            .addressState(DEFAULT_ADDRESS_STATE)
            .addressPincode(DEFAULT_ADDRESS_PINCODE)
            .gstNumber(DEFAULT_GST_NUMBER)
            .panNumber(DEFAULT_PAN_NUMBER)
            .creditLimit(DEFAULT_CREDIT_LIMIT)
            .paymentTermsDays(DEFAULT_PAYMENT_TERMS_DAYS)
            .openingBalance(DEFAULT_OPENING_BALANCE)
            .balance(DEFAULT_BALANCE)
            .createdAt(DEFAULT_CREATED_AT)
            .updatedAt(DEFAULT_UPDATED_AT)
            .deleted(DEFAULT_DELETED);
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Party createUpdatedEntity() {
        return new Party()
            .name(UPDATED_NAME)
            .type(UPDATED_TYPE)
            .mobile(UPDATED_MOBILE)
            .email(UPDATED_EMAIL)
            .addressLine1(UPDATED_ADDRESS_LINE_1)
            .addressCity(UPDATED_ADDRESS_CITY)
            .addressState(UPDATED_ADDRESS_STATE)
            .addressPincode(UPDATED_ADDRESS_PINCODE)
            .gstNumber(UPDATED_GST_NUMBER)
            .panNumber(UPDATED_PAN_NUMBER)
            .creditLimit(UPDATED_CREDIT_LIMIT)
            .paymentTermsDays(UPDATED_PAYMENT_TERMS_DAYS)
            .openingBalance(UPDATED_OPENING_BALANCE)
            .balance(UPDATED_BALANCE)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT)
            .deleted(UPDATED_DELETED);
    }

    @BeforeEach
    void initTest() {
        party = createEntity();
    }

    @AfterEach
    void cleanup() {
        if (insertedParty != null) {
            partyRepository.delete(insertedParty);
            insertedParty = null;
        }
    }

    @Test
    @Transactional
    void createParty() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the Party
        PartyDTO partyDTO = partyMapper.toDto(party);
        var returnedPartyDTO = om.readValue(
            restPartyMockMvc
                .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(partyDTO)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            PartyDTO.class
        );

        // Validate the Party in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedParty = partyMapper.toEntity(returnedPartyDTO);
        assertPartyUpdatableFieldsEquals(returnedParty, getPersistedParty(returnedParty));

        insertedParty = returnedParty;
    }

    @Test
    @Transactional
    void createPartyWithExistingId() throws Exception {
        // Create the Party with an existing ID
        party.setId(1L);
        PartyDTO partyDTO = partyMapper.toDto(party);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restPartyMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(partyDTO)))
            .andExpect(status().isBadRequest());

        // Validate the Party in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkNameIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        party.setName(null);

        // Create the Party, which fails.
        PartyDTO partyDTO = partyMapper.toDto(party);

        restPartyMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(partyDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkTypeIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        party.setType(null);

        // Create the Party, which fails.
        PartyDTO partyDTO = partyMapper.toDto(party);

        restPartyMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(partyDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkMobileIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        party.setMobile(null);

        // Create the Party, which fails.
        PartyDTO partyDTO = partyMapper.toDto(party);

        restPartyMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(partyDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkBalanceIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        party.setBalance(null);

        // Create the Party, which fails.
        PartyDTO partyDTO = partyMapper.toDto(party);

        restPartyMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(partyDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkCreatedAtIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        party.setCreatedAt(null);

        // Create the Party, which fails.
        PartyDTO partyDTO = partyMapper.toDto(party);

        restPartyMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(partyDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllParties() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList
        restPartyMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(party.getId().intValue())))
            .andExpect(jsonPath("$.[*].name").value(hasItem(DEFAULT_NAME)))
            .andExpect(jsonPath("$.[*].type").value(hasItem(DEFAULT_TYPE.toString())))
            .andExpect(jsonPath("$.[*].mobile").value(hasItem(DEFAULT_MOBILE)))
            .andExpect(jsonPath("$.[*].email").value(hasItem(DEFAULT_EMAIL)))
            .andExpect(jsonPath("$.[*].addressLine1").value(hasItem(DEFAULT_ADDRESS_LINE_1)))
            .andExpect(jsonPath("$.[*].addressCity").value(hasItem(DEFAULT_ADDRESS_CITY)))
            .andExpect(jsonPath("$.[*].addressState").value(hasItem(DEFAULT_ADDRESS_STATE)))
            .andExpect(jsonPath("$.[*].addressPincode").value(hasItem(DEFAULT_ADDRESS_PINCODE)))
            .andExpect(jsonPath("$.[*].gstNumber").value(hasItem(DEFAULT_GST_NUMBER)))
            .andExpect(jsonPath("$.[*].panNumber").value(hasItem(DEFAULT_PAN_NUMBER)))
            .andExpect(jsonPath("$.[*].creditLimit").value(hasItem(sameNumber(DEFAULT_CREDIT_LIMIT))))
            .andExpect(jsonPath("$.[*].paymentTermsDays").value(hasItem(DEFAULT_PAYMENT_TERMS_DAYS)))
            .andExpect(jsonPath("$.[*].openingBalance").value(hasItem(sameNumber(DEFAULT_OPENING_BALANCE))))
            .andExpect(jsonPath("$.[*].balance").value(hasItem(sameNumber(DEFAULT_BALANCE))))
            .andExpect(jsonPath("$.[*].createdAt").value(hasItem(DEFAULT_CREATED_AT.toString())))
            .andExpect(jsonPath("$.[*].updatedAt").value(hasItem(DEFAULT_UPDATED_AT.toString())))
            .andExpect(jsonPath("$.[*].deleted").value(hasItem(DEFAULT_DELETED)));
    }

    @SuppressWarnings({ "unchecked" })
    void getAllPartiesWithEagerRelationshipsIsEnabled() throws Exception {
        when(partyServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restPartyMockMvc.perform(get(ENTITY_API_URL + "?eagerload=true")).andExpect(status().isOk());

        verify(partyServiceMock, times(1)).findAllWithEagerRelationships(any());
    }

    @SuppressWarnings({ "unchecked" })
    void getAllPartiesWithEagerRelationshipsIsNotEnabled() throws Exception {
        when(partyServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restPartyMockMvc.perform(get(ENTITY_API_URL + "?eagerload=false")).andExpect(status().isOk());
        verify(partyRepositoryMock, times(1)).findAll(any(Pageable.class));
    }

    @Test
    @Transactional
    void getParty() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get the party
        restPartyMockMvc
            .perform(get(ENTITY_API_URL_ID, party.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(party.getId().intValue()))
            .andExpect(jsonPath("$.name").value(DEFAULT_NAME))
            .andExpect(jsonPath("$.type").value(DEFAULT_TYPE.toString()))
            .andExpect(jsonPath("$.mobile").value(DEFAULT_MOBILE))
            .andExpect(jsonPath("$.email").value(DEFAULT_EMAIL))
            .andExpect(jsonPath("$.addressLine1").value(DEFAULT_ADDRESS_LINE_1))
            .andExpect(jsonPath("$.addressCity").value(DEFAULT_ADDRESS_CITY))
            .andExpect(jsonPath("$.addressState").value(DEFAULT_ADDRESS_STATE))
            .andExpect(jsonPath("$.addressPincode").value(DEFAULT_ADDRESS_PINCODE))
            .andExpect(jsonPath("$.gstNumber").value(DEFAULT_GST_NUMBER))
            .andExpect(jsonPath("$.panNumber").value(DEFAULT_PAN_NUMBER))
            .andExpect(jsonPath("$.creditLimit").value(sameNumber(DEFAULT_CREDIT_LIMIT)))
            .andExpect(jsonPath("$.paymentTermsDays").value(DEFAULT_PAYMENT_TERMS_DAYS))
            .andExpect(jsonPath("$.openingBalance").value(sameNumber(DEFAULT_OPENING_BALANCE)))
            .andExpect(jsonPath("$.balance").value(sameNumber(DEFAULT_BALANCE)))
            .andExpect(jsonPath("$.createdAt").value(DEFAULT_CREATED_AT.toString()))
            .andExpect(jsonPath("$.updatedAt").value(DEFAULT_UPDATED_AT.toString()))
            .andExpect(jsonPath("$.deleted").value(DEFAULT_DELETED));
    }

    @Test
    @Transactional
    void getPartiesByIdFiltering() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        Long id = party.getId();

        defaultPartyFiltering("id.equals=" + id, "id.notEquals=" + id);

        defaultPartyFiltering("id.greaterThanOrEqual=" + id, "id.greaterThan=" + id);

        defaultPartyFiltering("id.lessThanOrEqual=" + id, "id.lessThan=" + id);
    }

    @Test
    @Transactional
    void getAllPartiesByNameIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where name equals to
        defaultPartyFiltering("name.equals=" + DEFAULT_NAME, "name.equals=" + UPDATED_NAME);
    }

    @Test
    @Transactional
    void getAllPartiesByNameIsInShouldWork() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where name in
        defaultPartyFiltering("name.in=" + DEFAULT_NAME + "," + UPDATED_NAME, "name.in=" + UPDATED_NAME);
    }

    @Test
    @Transactional
    void getAllPartiesByNameIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where name is not null
        defaultPartyFiltering("name.specified=true", "name.specified=false");
    }

    @Test
    @Transactional
    void getAllPartiesByNameContainsSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where name contains
        defaultPartyFiltering("name.contains=" + DEFAULT_NAME, "name.contains=" + UPDATED_NAME);
    }

    @Test
    @Transactional
    void getAllPartiesByNameNotContainsSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where name does not contain
        defaultPartyFiltering("name.doesNotContain=" + UPDATED_NAME, "name.doesNotContain=" + DEFAULT_NAME);
    }

    @Test
    @Transactional
    void getAllPartiesByTypeIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where type equals to
        defaultPartyFiltering("type.equals=" + DEFAULT_TYPE, "type.equals=" + UPDATED_TYPE);
    }

    @Test
    @Transactional
    void getAllPartiesByTypeIsInShouldWork() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where type in
        defaultPartyFiltering("type.in=" + DEFAULT_TYPE + "," + UPDATED_TYPE, "type.in=" + UPDATED_TYPE);
    }

    @Test
    @Transactional
    void getAllPartiesByTypeIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where type is not null
        defaultPartyFiltering("type.specified=true", "type.specified=false");
    }

    @Test
    @Transactional
    void getAllPartiesByMobileIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where mobile equals to
        defaultPartyFiltering("mobile.equals=" + DEFAULT_MOBILE, "mobile.equals=" + UPDATED_MOBILE);
    }

    @Test
    @Transactional
    void getAllPartiesByMobileIsInShouldWork() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where mobile in
        defaultPartyFiltering("mobile.in=" + DEFAULT_MOBILE + "," + UPDATED_MOBILE, "mobile.in=" + UPDATED_MOBILE);
    }

    @Test
    @Transactional
    void getAllPartiesByMobileIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where mobile is not null
        defaultPartyFiltering("mobile.specified=true", "mobile.specified=false");
    }

    @Test
    @Transactional
    void getAllPartiesByMobileContainsSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where mobile contains
        defaultPartyFiltering("mobile.contains=" + DEFAULT_MOBILE, "mobile.contains=" + UPDATED_MOBILE);
    }

    @Test
    @Transactional
    void getAllPartiesByMobileNotContainsSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where mobile does not contain
        defaultPartyFiltering("mobile.doesNotContain=" + UPDATED_MOBILE, "mobile.doesNotContain=" + DEFAULT_MOBILE);
    }

    @Test
    @Transactional
    void getAllPartiesByEmailIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where email equals to
        defaultPartyFiltering("email.equals=" + DEFAULT_EMAIL, "email.equals=" + UPDATED_EMAIL);
    }

    @Test
    @Transactional
    void getAllPartiesByEmailIsInShouldWork() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where email in
        defaultPartyFiltering("email.in=" + DEFAULT_EMAIL + "," + UPDATED_EMAIL, "email.in=" + UPDATED_EMAIL);
    }

    @Test
    @Transactional
    void getAllPartiesByEmailIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where email is not null
        defaultPartyFiltering("email.specified=true", "email.specified=false");
    }

    @Test
    @Transactional
    void getAllPartiesByEmailContainsSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where email contains
        defaultPartyFiltering("email.contains=" + DEFAULT_EMAIL, "email.contains=" + UPDATED_EMAIL);
    }

    @Test
    @Transactional
    void getAllPartiesByEmailNotContainsSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where email does not contain
        defaultPartyFiltering("email.doesNotContain=" + UPDATED_EMAIL, "email.doesNotContain=" + DEFAULT_EMAIL);
    }

    @Test
    @Transactional
    void getAllPartiesByAddressLine1IsEqualToSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where addressLine1 equals to
        defaultPartyFiltering("addressLine1.equals=" + DEFAULT_ADDRESS_LINE_1, "addressLine1.equals=" + UPDATED_ADDRESS_LINE_1);
    }

    @Test
    @Transactional
    void getAllPartiesByAddressLine1IsInShouldWork() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where addressLine1 in
        defaultPartyFiltering(
            "addressLine1.in=" + DEFAULT_ADDRESS_LINE_1 + "," + UPDATED_ADDRESS_LINE_1,
            "addressLine1.in=" + UPDATED_ADDRESS_LINE_1
        );
    }

    @Test
    @Transactional
    void getAllPartiesByAddressLine1IsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where addressLine1 is not null
        defaultPartyFiltering("addressLine1.specified=true", "addressLine1.specified=false");
    }

    @Test
    @Transactional
    void getAllPartiesByAddressLine1ContainsSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where addressLine1 contains
        defaultPartyFiltering("addressLine1.contains=" + DEFAULT_ADDRESS_LINE_1, "addressLine1.contains=" + UPDATED_ADDRESS_LINE_1);
    }

    @Test
    @Transactional
    void getAllPartiesByAddressLine1NotContainsSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where addressLine1 does not contain
        defaultPartyFiltering(
            "addressLine1.doesNotContain=" + UPDATED_ADDRESS_LINE_1,
            "addressLine1.doesNotContain=" + DEFAULT_ADDRESS_LINE_1
        );
    }

    @Test
    @Transactional
    void getAllPartiesByAddressCityIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where addressCity equals to
        defaultPartyFiltering("addressCity.equals=" + DEFAULT_ADDRESS_CITY, "addressCity.equals=" + UPDATED_ADDRESS_CITY);
    }

    @Test
    @Transactional
    void getAllPartiesByAddressCityIsInShouldWork() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where addressCity in
        defaultPartyFiltering(
            "addressCity.in=" + DEFAULT_ADDRESS_CITY + "," + UPDATED_ADDRESS_CITY,
            "addressCity.in=" + UPDATED_ADDRESS_CITY
        );
    }

    @Test
    @Transactional
    void getAllPartiesByAddressCityIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where addressCity is not null
        defaultPartyFiltering("addressCity.specified=true", "addressCity.specified=false");
    }

    @Test
    @Transactional
    void getAllPartiesByAddressCityContainsSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where addressCity contains
        defaultPartyFiltering("addressCity.contains=" + DEFAULT_ADDRESS_CITY, "addressCity.contains=" + UPDATED_ADDRESS_CITY);
    }

    @Test
    @Transactional
    void getAllPartiesByAddressCityNotContainsSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where addressCity does not contain
        defaultPartyFiltering("addressCity.doesNotContain=" + UPDATED_ADDRESS_CITY, "addressCity.doesNotContain=" + DEFAULT_ADDRESS_CITY);
    }

    @Test
    @Transactional
    void getAllPartiesByAddressStateIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where addressState equals to
        defaultPartyFiltering("addressState.equals=" + DEFAULT_ADDRESS_STATE, "addressState.equals=" + UPDATED_ADDRESS_STATE);
    }

    @Test
    @Transactional
    void getAllPartiesByAddressStateIsInShouldWork() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where addressState in
        defaultPartyFiltering(
            "addressState.in=" + DEFAULT_ADDRESS_STATE + "," + UPDATED_ADDRESS_STATE,
            "addressState.in=" + UPDATED_ADDRESS_STATE
        );
    }

    @Test
    @Transactional
    void getAllPartiesByAddressStateIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where addressState is not null
        defaultPartyFiltering("addressState.specified=true", "addressState.specified=false");
    }

    @Test
    @Transactional
    void getAllPartiesByAddressStateContainsSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where addressState contains
        defaultPartyFiltering("addressState.contains=" + DEFAULT_ADDRESS_STATE, "addressState.contains=" + UPDATED_ADDRESS_STATE);
    }

    @Test
    @Transactional
    void getAllPartiesByAddressStateNotContainsSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where addressState does not contain
        defaultPartyFiltering(
            "addressState.doesNotContain=" + UPDATED_ADDRESS_STATE,
            "addressState.doesNotContain=" + DEFAULT_ADDRESS_STATE
        );
    }

    @Test
    @Transactional
    void getAllPartiesByAddressPincodeIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where addressPincode equals to
        defaultPartyFiltering("addressPincode.equals=" + DEFAULT_ADDRESS_PINCODE, "addressPincode.equals=" + UPDATED_ADDRESS_PINCODE);
    }

    @Test
    @Transactional
    void getAllPartiesByAddressPincodeIsInShouldWork() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where addressPincode in
        defaultPartyFiltering(
            "addressPincode.in=" + DEFAULT_ADDRESS_PINCODE + "," + UPDATED_ADDRESS_PINCODE,
            "addressPincode.in=" + UPDATED_ADDRESS_PINCODE
        );
    }

    @Test
    @Transactional
    void getAllPartiesByAddressPincodeIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where addressPincode is not null
        defaultPartyFiltering("addressPincode.specified=true", "addressPincode.specified=false");
    }

    @Test
    @Transactional
    void getAllPartiesByAddressPincodeContainsSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where addressPincode contains
        defaultPartyFiltering("addressPincode.contains=" + DEFAULT_ADDRESS_PINCODE, "addressPincode.contains=" + UPDATED_ADDRESS_PINCODE);
    }

    @Test
    @Transactional
    void getAllPartiesByAddressPincodeNotContainsSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where addressPincode does not contain
        defaultPartyFiltering(
            "addressPincode.doesNotContain=" + UPDATED_ADDRESS_PINCODE,
            "addressPincode.doesNotContain=" + DEFAULT_ADDRESS_PINCODE
        );
    }

    @Test
    @Transactional
    void getAllPartiesByGstNumberIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where gstNumber equals to
        defaultPartyFiltering("gstNumber.equals=" + DEFAULT_GST_NUMBER, "gstNumber.equals=" + UPDATED_GST_NUMBER);
    }

    @Test
    @Transactional
    void getAllPartiesByGstNumberIsInShouldWork() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where gstNumber in
        defaultPartyFiltering("gstNumber.in=" + DEFAULT_GST_NUMBER + "," + UPDATED_GST_NUMBER, "gstNumber.in=" + UPDATED_GST_NUMBER);
    }

    @Test
    @Transactional
    void getAllPartiesByGstNumberIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where gstNumber is not null
        defaultPartyFiltering("gstNumber.specified=true", "gstNumber.specified=false");
    }

    @Test
    @Transactional
    void getAllPartiesByGstNumberContainsSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where gstNumber contains
        defaultPartyFiltering("gstNumber.contains=" + DEFAULT_GST_NUMBER, "gstNumber.contains=" + UPDATED_GST_NUMBER);
    }

    @Test
    @Transactional
    void getAllPartiesByGstNumberNotContainsSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where gstNumber does not contain
        defaultPartyFiltering("gstNumber.doesNotContain=" + UPDATED_GST_NUMBER, "gstNumber.doesNotContain=" + DEFAULT_GST_NUMBER);
    }

    @Test
    @Transactional
    void getAllPartiesByPanNumberIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where panNumber equals to
        defaultPartyFiltering("panNumber.equals=" + DEFAULT_PAN_NUMBER, "panNumber.equals=" + UPDATED_PAN_NUMBER);
    }

    @Test
    @Transactional
    void getAllPartiesByPanNumberIsInShouldWork() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where panNumber in
        defaultPartyFiltering("panNumber.in=" + DEFAULT_PAN_NUMBER + "," + UPDATED_PAN_NUMBER, "panNumber.in=" + UPDATED_PAN_NUMBER);
    }

    @Test
    @Transactional
    void getAllPartiesByPanNumberIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where panNumber is not null
        defaultPartyFiltering("panNumber.specified=true", "panNumber.specified=false");
    }

    @Test
    @Transactional
    void getAllPartiesByPanNumberContainsSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where panNumber contains
        defaultPartyFiltering("panNumber.contains=" + DEFAULT_PAN_NUMBER, "panNumber.contains=" + UPDATED_PAN_NUMBER);
    }

    @Test
    @Transactional
    void getAllPartiesByPanNumberNotContainsSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where panNumber does not contain
        defaultPartyFiltering("panNumber.doesNotContain=" + UPDATED_PAN_NUMBER, "panNumber.doesNotContain=" + DEFAULT_PAN_NUMBER);
    }

    @Test
    @Transactional
    void getAllPartiesByCreditLimitIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where creditLimit equals to
        defaultPartyFiltering("creditLimit.equals=" + DEFAULT_CREDIT_LIMIT, "creditLimit.equals=" + UPDATED_CREDIT_LIMIT);
    }

    @Test
    @Transactional
    void getAllPartiesByCreditLimitIsInShouldWork() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where creditLimit in
        defaultPartyFiltering(
            "creditLimit.in=" + DEFAULT_CREDIT_LIMIT + "," + UPDATED_CREDIT_LIMIT,
            "creditLimit.in=" + UPDATED_CREDIT_LIMIT
        );
    }

    @Test
    @Transactional
    void getAllPartiesByCreditLimitIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where creditLimit is not null
        defaultPartyFiltering("creditLimit.specified=true", "creditLimit.specified=false");
    }

    @Test
    @Transactional
    void getAllPartiesByCreditLimitIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where creditLimit is greater than or equal to
        defaultPartyFiltering(
            "creditLimit.greaterThanOrEqual=" + DEFAULT_CREDIT_LIMIT,
            "creditLimit.greaterThanOrEqual=" + UPDATED_CREDIT_LIMIT
        );
    }

    @Test
    @Transactional
    void getAllPartiesByCreditLimitIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where creditLimit is less than or equal to
        defaultPartyFiltering("creditLimit.lessThanOrEqual=" + DEFAULT_CREDIT_LIMIT, "creditLimit.lessThanOrEqual=" + SMALLER_CREDIT_LIMIT);
    }

    @Test
    @Transactional
    void getAllPartiesByCreditLimitIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where creditLimit is less than
        defaultPartyFiltering("creditLimit.lessThan=" + UPDATED_CREDIT_LIMIT, "creditLimit.lessThan=" + DEFAULT_CREDIT_LIMIT);
    }

    @Test
    @Transactional
    void getAllPartiesByCreditLimitIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where creditLimit is greater than
        defaultPartyFiltering("creditLimit.greaterThan=" + SMALLER_CREDIT_LIMIT, "creditLimit.greaterThan=" + DEFAULT_CREDIT_LIMIT);
    }

    @Test
    @Transactional
    void getAllPartiesByPaymentTermsDaysIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where paymentTermsDays equals to
        defaultPartyFiltering(
            "paymentTermsDays.equals=" + DEFAULT_PAYMENT_TERMS_DAYS,
            "paymentTermsDays.equals=" + UPDATED_PAYMENT_TERMS_DAYS
        );
    }

    @Test
    @Transactional
    void getAllPartiesByPaymentTermsDaysIsInShouldWork() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where paymentTermsDays in
        defaultPartyFiltering(
            "paymentTermsDays.in=" + DEFAULT_PAYMENT_TERMS_DAYS + "," + UPDATED_PAYMENT_TERMS_DAYS,
            "paymentTermsDays.in=" + UPDATED_PAYMENT_TERMS_DAYS
        );
    }

    @Test
    @Transactional
    void getAllPartiesByPaymentTermsDaysIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where paymentTermsDays is not null
        defaultPartyFiltering("paymentTermsDays.specified=true", "paymentTermsDays.specified=false");
    }

    @Test
    @Transactional
    void getAllPartiesByPaymentTermsDaysIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where paymentTermsDays is greater than or equal to
        defaultPartyFiltering(
            "paymentTermsDays.greaterThanOrEqual=" + DEFAULT_PAYMENT_TERMS_DAYS,
            "paymentTermsDays.greaterThanOrEqual=" + (DEFAULT_PAYMENT_TERMS_DAYS + 1)
        );
    }

    @Test
    @Transactional
    void getAllPartiesByPaymentTermsDaysIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where paymentTermsDays is less than or equal to
        defaultPartyFiltering(
            "paymentTermsDays.lessThanOrEqual=" + DEFAULT_PAYMENT_TERMS_DAYS,
            "paymentTermsDays.lessThanOrEqual=" + SMALLER_PAYMENT_TERMS_DAYS
        );
    }

    @Test
    @Transactional
    void getAllPartiesByPaymentTermsDaysIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where paymentTermsDays is less than
        defaultPartyFiltering(
            "paymentTermsDays.lessThan=" + (DEFAULT_PAYMENT_TERMS_DAYS + 1),
            "paymentTermsDays.lessThan=" + DEFAULT_PAYMENT_TERMS_DAYS
        );
    }

    @Test
    @Transactional
    void getAllPartiesByPaymentTermsDaysIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where paymentTermsDays is greater than
        defaultPartyFiltering(
            "paymentTermsDays.greaterThan=" + SMALLER_PAYMENT_TERMS_DAYS,
            "paymentTermsDays.greaterThan=" + DEFAULT_PAYMENT_TERMS_DAYS
        );
    }

    @Test
    @Transactional
    void getAllPartiesByOpeningBalanceIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where openingBalance equals to
        defaultPartyFiltering("openingBalance.equals=" + DEFAULT_OPENING_BALANCE, "openingBalance.equals=" + UPDATED_OPENING_BALANCE);
    }

    @Test
    @Transactional
    void getAllPartiesByOpeningBalanceIsInShouldWork() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where openingBalance in
        defaultPartyFiltering(
            "openingBalance.in=" + DEFAULT_OPENING_BALANCE + "," + UPDATED_OPENING_BALANCE,
            "openingBalance.in=" + UPDATED_OPENING_BALANCE
        );
    }

    @Test
    @Transactional
    void getAllPartiesByOpeningBalanceIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where openingBalance is not null
        defaultPartyFiltering("openingBalance.specified=true", "openingBalance.specified=false");
    }

    @Test
    @Transactional
    void getAllPartiesByOpeningBalanceIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where openingBalance is greater than or equal to
        defaultPartyFiltering(
            "openingBalance.greaterThanOrEqual=" + DEFAULT_OPENING_BALANCE,
            "openingBalance.greaterThanOrEqual=" + UPDATED_OPENING_BALANCE
        );
    }

    @Test
    @Transactional
    void getAllPartiesByOpeningBalanceIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where openingBalance is less than or equal to
        defaultPartyFiltering(
            "openingBalance.lessThanOrEqual=" + DEFAULT_OPENING_BALANCE,
            "openingBalance.lessThanOrEqual=" + SMALLER_OPENING_BALANCE
        );
    }

    @Test
    @Transactional
    void getAllPartiesByOpeningBalanceIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where openingBalance is less than
        defaultPartyFiltering("openingBalance.lessThan=" + UPDATED_OPENING_BALANCE, "openingBalance.lessThan=" + DEFAULT_OPENING_BALANCE);
    }

    @Test
    @Transactional
    void getAllPartiesByOpeningBalanceIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where openingBalance is greater than
        defaultPartyFiltering(
            "openingBalance.greaterThan=" + SMALLER_OPENING_BALANCE,
            "openingBalance.greaterThan=" + DEFAULT_OPENING_BALANCE
        );
    }

    @Test
    @Transactional
    void getAllPartiesByBalanceIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where balance equals to
        defaultPartyFiltering("balance.equals=" + DEFAULT_BALANCE, "balance.equals=" + UPDATED_BALANCE);
    }

    @Test
    @Transactional
    void getAllPartiesByBalanceIsInShouldWork() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where balance in
        defaultPartyFiltering("balance.in=" + DEFAULT_BALANCE + "," + UPDATED_BALANCE, "balance.in=" + UPDATED_BALANCE);
    }

    @Test
    @Transactional
    void getAllPartiesByBalanceIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where balance is not null
        defaultPartyFiltering("balance.specified=true", "balance.specified=false");
    }

    @Test
    @Transactional
    void getAllPartiesByBalanceIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where balance is greater than or equal to
        defaultPartyFiltering("balance.greaterThanOrEqual=" + DEFAULT_BALANCE, "balance.greaterThanOrEqual=" + UPDATED_BALANCE);
    }

    @Test
    @Transactional
    void getAllPartiesByBalanceIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where balance is less than or equal to
        defaultPartyFiltering("balance.lessThanOrEqual=" + DEFAULT_BALANCE, "balance.lessThanOrEqual=" + SMALLER_BALANCE);
    }

    @Test
    @Transactional
    void getAllPartiesByBalanceIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where balance is less than
        defaultPartyFiltering("balance.lessThan=" + UPDATED_BALANCE, "balance.lessThan=" + DEFAULT_BALANCE);
    }

    @Test
    @Transactional
    void getAllPartiesByBalanceIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where balance is greater than
        defaultPartyFiltering("balance.greaterThan=" + SMALLER_BALANCE, "balance.greaterThan=" + DEFAULT_BALANCE);
    }

    @Test
    @Transactional
    void getAllPartiesByCreatedAtIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where createdAt equals to
        defaultPartyFiltering("createdAt.equals=" + DEFAULT_CREATED_AT, "createdAt.equals=" + UPDATED_CREATED_AT);
    }

    @Test
    @Transactional
    void getAllPartiesByCreatedAtIsInShouldWork() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where createdAt in
        defaultPartyFiltering("createdAt.in=" + DEFAULT_CREATED_AT + "," + UPDATED_CREATED_AT, "createdAt.in=" + UPDATED_CREATED_AT);
    }

    @Test
    @Transactional
    void getAllPartiesByCreatedAtIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where createdAt is not null
        defaultPartyFiltering("createdAt.specified=true", "createdAt.specified=false");
    }

    @Test
    @Transactional
    void getAllPartiesByUpdatedAtIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where updatedAt equals to
        defaultPartyFiltering("updatedAt.equals=" + DEFAULT_UPDATED_AT, "updatedAt.equals=" + UPDATED_UPDATED_AT);
    }

    @Test
    @Transactional
    void getAllPartiesByUpdatedAtIsInShouldWork() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where updatedAt in
        defaultPartyFiltering("updatedAt.in=" + DEFAULT_UPDATED_AT + "," + UPDATED_UPDATED_AT, "updatedAt.in=" + UPDATED_UPDATED_AT);
    }

    @Test
    @Transactional
    void getAllPartiesByUpdatedAtIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where updatedAt is not null
        defaultPartyFiltering("updatedAt.specified=true", "updatedAt.specified=false");
    }

    @Test
    @Transactional
    void getAllPartiesByDeletedIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where deleted equals to
        defaultPartyFiltering("deleted.equals=" + DEFAULT_DELETED, "deleted.equals=" + UPDATED_DELETED);
    }

    @Test
    @Transactional
    void getAllPartiesByDeletedIsInShouldWork() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where deleted in
        defaultPartyFiltering("deleted.in=" + DEFAULT_DELETED + "," + UPDATED_DELETED, "deleted.in=" + UPDATED_DELETED);
    }

    @Test
    @Transactional
    void getAllPartiesByDeletedIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        // Get all the partyList where deleted is not null
        defaultPartyFiltering("deleted.specified=true", "deleted.specified=false");
    }

    @Test
    @Transactional
    void getAllPartiesByBusinessIsEqualToSomething() throws Exception {
        Business business;
        if (TestUtil.findAll(em, Business.class).isEmpty()) {
            partyRepository.saveAndFlush(party);
            business = BusinessResourceIT.createEntity();
        } else {
            business = TestUtil.findAll(em, Business.class).get(0);
        }
        em.persist(business);
        em.flush();
        party.setBusiness(business);
        partyRepository.saveAndFlush(party);
        Long businessId = business.getId();
        // Get all the partyList where business equals to businessId
        defaultPartyShouldBeFound("businessId.equals=" + businessId);

        // Get all the partyList where business equals to (businessId + 1)
        defaultPartyShouldNotBeFound("businessId.equals=" + (businessId + 1));
    }

    private void defaultPartyFiltering(String shouldBeFound, String shouldNotBeFound) throws Exception {
        defaultPartyShouldBeFound(shouldBeFound);
        defaultPartyShouldNotBeFound(shouldNotBeFound);
    }

    /**
     * Executes the search, and checks that the default entity is returned.
     */
    private void defaultPartyShouldBeFound(String filter) throws Exception {
        restPartyMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(party.getId().intValue())))
            .andExpect(jsonPath("$.[*].name").value(hasItem(DEFAULT_NAME)))
            .andExpect(jsonPath("$.[*].type").value(hasItem(DEFAULT_TYPE.toString())))
            .andExpect(jsonPath("$.[*].mobile").value(hasItem(DEFAULT_MOBILE)))
            .andExpect(jsonPath("$.[*].email").value(hasItem(DEFAULT_EMAIL)))
            .andExpect(jsonPath("$.[*].addressLine1").value(hasItem(DEFAULT_ADDRESS_LINE_1)))
            .andExpect(jsonPath("$.[*].addressCity").value(hasItem(DEFAULT_ADDRESS_CITY)))
            .andExpect(jsonPath("$.[*].addressState").value(hasItem(DEFAULT_ADDRESS_STATE)))
            .andExpect(jsonPath("$.[*].addressPincode").value(hasItem(DEFAULT_ADDRESS_PINCODE)))
            .andExpect(jsonPath("$.[*].gstNumber").value(hasItem(DEFAULT_GST_NUMBER)))
            .andExpect(jsonPath("$.[*].panNumber").value(hasItem(DEFAULT_PAN_NUMBER)))
            .andExpect(jsonPath("$.[*].creditLimit").value(hasItem(sameNumber(DEFAULT_CREDIT_LIMIT))))
            .andExpect(jsonPath("$.[*].paymentTermsDays").value(hasItem(DEFAULT_PAYMENT_TERMS_DAYS)))
            .andExpect(jsonPath("$.[*].openingBalance").value(hasItem(sameNumber(DEFAULT_OPENING_BALANCE))))
            .andExpect(jsonPath("$.[*].balance").value(hasItem(sameNumber(DEFAULT_BALANCE))))
            .andExpect(jsonPath("$.[*].createdAt").value(hasItem(DEFAULT_CREATED_AT.toString())))
            .andExpect(jsonPath("$.[*].updatedAt").value(hasItem(DEFAULT_UPDATED_AT.toString())))
            .andExpect(jsonPath("$.[*].deleted").value(hasItem(DEFAULT_DELETED)));

        // Check, that the count call also returns 1
        restPartyMockMvc
            .perform(get(ENTITY_API_URL + "/count?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(content().string("1"));
    }

    /**
     * Executes the search, and checks that the default entity is not returned.
     */
    private void defaultPartyShouldNotBeFound(String filter) throws Exception {
        restPartyMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$").isEmpty());

        // Check, that the count call also returns 0
        restPartyMockMvc
            .perform(get(ENTITY_API_URL + "/count?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(content().string("0"));
    }

    @Test
    @Transactional
    void getNonExistingParty() throws Exception {
        // Get the party
        restPartyMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingParty() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the party
        Party updatedParty = partyRepository.findById(party.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedParty are not directly saved in db
        em.detach(updatedParty);
        updatedParty
            .name(UPDATED_NAME)
            .type(UPDATED_TYPE)
            .mobile(UPDATED_MOBILE)
            .email(UPDATED_EMAIL)
            .addressLine1(UPDATED_ADDRESS_LINE_1)
            .addressCity(UPDATED_ADDRESS_CITY)
            .addressState(UPDATED_ADDRESS_STATE)
            .addressPincode(UPDATED_ADDRESS_PINCODE)
            .gstNumber(UPDATED_GST_NUMBER)
            .panNumber(UPDATED_PAN_NUMBER)
            .creditLimit(UPDATED_CREDIT_LIMIT)
            .paymentTermsDays(UPDATED_PAYMENT_TERMS_DAYS)
            .openingBalance(UPDATED_OPENING_BALANCE)
            .balance(UPDATED_BALANCE)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT)
            .deleted(UPDATED_DELETED);
        PartyDTO partyDTO = partyMapper.toDto(updatedParty);

        restPartyMockMvc
            .perform(
                put(ENTITY_API_URL_ID, partyDTO.getId()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(partyDTO))
            )
            .andExpect(status().isOk());

        // Validate the Party in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedPartyToMatchAllProperties(updatedParty);
    }

    @Test
    @Transactional
    void putNonExistingParty() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        party.setId(longCount.incrementAndGet());

        // Create the Party
        PartyDTO partyDTO = partyMapper.toDto(party);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restPartyMockMvc
            .perform(
                put(ENTITY_API_URL_ID, partyDTO.getId()).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(partyDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Party in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchParty() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        party.setId(longCount.incrementAndGet());

        // Create the Party
        PartyDTO partyDTO = partyMapper.toDto(party);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPartyMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(partyDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Party in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamParty() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        party.setId(longCount.incrementAndGet());

        // Create the Party
        PartyDTO partyDTO = partyMapper.toDto(party);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPartyMockMvc
            .perform(put(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(partyDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Party in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdatePartyWithPatch() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the party using partial update
        Party partialUpdatedParty = new Party();
        partialUpdatedParty.setId(party.getId());

        partialUpdatedParty
            .name(UPDATED_NAME)
            .type(UPDATED_TYPE)
            .mobile(UPDATED_MOBILE)
            .email(UPDATED_EMAIL)
            .addressState(UPDATED_ADDRESS_STATE)
            .addressPincode(UPDATED_ADDRESS_PINCODE)
            .creditLimit(UPDATED_CREDIT_LIMIT)
            .paymentTermsDays(UPDATED_PAYMENT_TERMS_DAYS)
            .createdAt(UPDATED_CREATED_AT);

        restPartyMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedParty.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedParty))
            )
            .andExpect(status().isOk());

        // Validate the Party in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPartyUpdatableFieldsEquals(createUpdateProxyForBean(partialUpdatedParty, party), getPersistedParty(party));
    }

    @Test
    @Transactional
    void fullUpdatePartyWithPatch() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the party using partial update
        Party partialUpdatedParty = new Party();
        partialUpdatedParty.setId(party.getId());

        partialUpdatedParty
            .name(UPDATED_NAME)
            .type(UPDATED_TYPE)
            .mobile(UPDATED_MOBILE)
            .email(UPDATED_EMAIL)
            .addressLine1(UPDATED_ADDRESS_LINE_1)
            .addressCity(UPDATED_ADDRESS_CITY)
            .addressState(UPDATED_ADDRESS_STATE)
            .addressPincode(UPDATED_ADDRESS_PINCODE)
            .gstNumber(UPDATED_GST_NUMBER)
            .panNumber(UPDATED_PAN_NUMBER)
            .creditLimit(UPDATED_CREDIT_LIMIT)
            .paymentTermsDays(UPDATED_PAYMENT_TERMS_DAYS)
            .openingBalance(UPDATED_OPENING_BALANCE)
            .balance(UPDATED_BALANCE)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT)
            .deleted(UPDATED_DELETED);

        restPartyMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedParty.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedParty))
            )
            .andExpect(status().isOk());

        // Validate the Party in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPartyUpdatableFieldsEquals(partialUpdatedParty, getPersistedParty(partialUpdatedParty));
    }

    @Test
    @Transactional
    void patchNonExistingParty() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        party.setId(longCount.incrementAndGet());

        // Create the Party
        PartyDTO partyDTO = partyMapper.toDto(party);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restPartyMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partyDTO.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partyDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Party in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchParty() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        party.setId(longCount.incrementAndGet());

        // Create the Party
        PartyDTO partyDTO = partyMapper.toDto(party);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPartyMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partyDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Party in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamParty() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        party.setId(longCount.incrementAndGet());

        // Create the Party
        PartyDTO partyDTO = partyMapper.toDto(party);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restPartyMockMvc
            .perform(patch(ENTITY_API_URL).contentType("application/merge-patch+json").content(om.writeValueAsBytes(partyDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Party in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteParty() throws Exception {
        // Initialize the database
        insertedParty = partyRepository.saveAndFlush(party);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the party
        restPartyMockMvc
            .perform(delete(ENTITY_API_URL_ID, party.getId()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return partyRepository.count();
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

    protected Party getPersistedParty(Party party) {
        return partyRepository.findById(party.getId()).orElseThrow();
    }

    protected void assertPersistedPartyToMatchAllProperties(Party expectedParty) {
        assertPartyAllPropertiesEquals(expectedParty, getPersistedParty(expectedParty));
    }

    protected void assertPersistedPartyToMatchUpdatableProperties(Party expectedParty) {
        assertPartyAllUpdatablePropertiesEquals(expectedParty, getPersistedParty(expectedParty));
    }
}
