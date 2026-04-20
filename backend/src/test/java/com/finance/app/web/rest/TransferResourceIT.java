package com.finance.app.web.rest;

import static com.finance.app.domain.TransferAsserts.*;
import static com.finance.app.web.rest.TestUtil.createUpdateProxyForBean;
import static com.finance.app.web.rest.TestUtil.sameNumber;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.app.IntegrationTest;
import com.finance.app.domain.Account;
import com.finance.app.domain.Business;
import com.finance.app.domain.Transfer;
import com.finance.app.repository.TransferRepository;
import com.finance.app.service.TransferService;
import com.finance.app.service.dto.TransferDTO;
import com.finance.app.service.mapper.TransferMapper;
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
 * Integration tests for the {@link TransferResource} REST controller.
 */
@IntegrationTest
@ExtendWith(MockitoExtension.class)
@AutoConfigureMockMvc
@WithMockUser
class TransferResourceIT {

    private static final Instant DEFAULT_DATE = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_DATE = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final BigDecimal DEFAULT_AMOUNT = new BigDecimal(0);
    private static final BigDecimal UPDATED_AMOUNT = new BigDecimal(1);
    private static final BigDecimal SMALLER_AMOUNT = new BigDecimal(0 - 1);

    private static final String DEFAULT_NOTES = "AAAAAAAAAA";
    private static final String UPDATED_NOTES = "BBBBBBBBBB";

    private static final Instant DEFAULT_CREATED_AT = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_CREATED_AT = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final Instant DEFAULT_UPDATED_AT = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_UPDATED_AT = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final String ENTITY_API_URL = "/api/transfers";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2L * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private TransferRepository transferRepository;

    @Mock
    private TransferRepository transferRepositoryMock;

    @Autowired
    private TransferMapper transferMapper;

    @Mock
    private TransferService transferServiceMock;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restTransferMockMvc;

    private Transfer transfer;

    private Transfer insertedTransfer;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Transfer createEntity() {
        return new Transfer()
            .date(DEFAULT_DATE)
            .amount(DEFAULT_AMOUNT)
            .notes(DEFAULT_NOTES)
            .createdAt(DEFAULT_CREATED_AT)
            .updatedAt(DEFAULT_UPDATED_AT);
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Transfer createUpdatedEntity() {
        return new Transfer()
            .date(UPDATED_DATE)
            .amount(UPDATED_AMOUNT)
            .notes(UPDATED_NOTES)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT);
    }

    @BeforeEach
    void initTest() {
        transfer = createEntity();
    }

    @AfterEach
    void cleanup() {
        if (insertedTransfer != null) {
            transferRepository.delete(insertedTransfer);
            insertedTransfer = null;
        }
    }

    @Test
    @Transactional
    void createTransfer() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the Transfer
        TransferDTO transferDTO = transferMapper.toDto(transfer);
        var returnedTransferDTO = om.readValue(
            restTransferMockMvc
                .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(transferDTO)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            TransferDTO.class
        );

        // Validate the Transfer in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedTransfer = transferMapper.toEntity(returnedTransferDTO);
        assertTransferUpdatableFieldsEquals(returnedTransfer, getPersistedTransfer(returnedTransfer));

        insertedTransfer = returnedTransfer;
    }

    @Test
    @Transactional
    void createTransferWithExistingId() throws Exception {
        // Create the Transfer with an existing ID
        transfer.setId(1L);
        TransferDTO transferDTO = transferMapper.toDto(transfer);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restTransferMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(transferDTO)))
            .andExpect(status().isBadRequest());

        // Validate the Transfer in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkDateIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        transfer.setDate(null);

        // Create the Transfer, which fails.
        TransferDTO transferDTO = transferMapper.toDto(transfer);

        restTransferMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(transferDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkAmountIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        transfer.setAmount(null);

        // Create the Transfer, which fails.
        TransferDTO transferDTO = transferMapper.toDto(transfer);

        restTransferMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(transferDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkCreatedAtIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        transfer.setCreatedAt(null);

        // Create the Transfer, which fails.
        TransferDTO transferDTO = transferMapper.toDto(transfer);

        restTransferMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(transferDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllTransfers() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        // Get all the transferList
        restTransferMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(transfer.getId().intValue())))
            .andExpect(jsonPath("$.[*].date").value(hasItem(DEFAULT_DATE.toString())))
            .andExpect(jsonPath("$.[*].amount").value(hasItem(sameNumber(DEFAULT_AMOUNT))))
            .andExpect(jsonPath("$.[*].notes").value(hasItem(DEFAULT_NOTES)))
            .andExpect(jsonPath("$.[*].createdAt").value(hasItem(DEFAULT_CREATED_AT.toString())))
            .andExpect(jsonPath("$.[*].updatedAt").value(hasItem(DEFAULT_UPDATED_AT.toString())));
    }

    @SuppressWarnings({ "unchecked" })
    void getAllTransfersWithEagerRelationshipsIsEnabled() throws Exception {
        when(transferServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restTransferMockMvc.perform(get(ENTITY_API_URL + "?eagerload=true")).andExpect(status().isOk());

        verify(transferServiceMock, times(1)).findAllWithEagerRelationships(any());
    }

    @SuppressWarnings({ "unchecked" })
    void getAllTransfersWithEagerRelationshipsIsNotEnabled() throws Exception {
        when(transferServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restTransferMockMvc.perform(get(ENTITY_API_URL + "?eagerload=false")).andExpect(status().isOk());
        verify(transferRepositoryMock, times(1)).findAll(any(Pageable.class));
    }

    @Test
    @Transactional
    void getTransfer() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        // Get the transfer
        restTransferMockMvc
            .perform(get(ENTITY_API_URL_ID, transfer.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(transfer.getId().intValue()))
            .andExpect(jsonPath("$.date").value(DEFAULT_DATE.toString()))
            .andExpect(jsonPath("$.amount").value(sameNumber(DEFAULT_AMOUNT)))
            .andExpect(jsonPath("$.notes").value(DEFAULT_NOTES))
            .andExpect(jsonPath("$.createdAt").value(DEFAULT_CREATED_AT.toString()))
            .andExpect(jsonPath("$.updatedAt").value(DEFAULT_UPDATED_AT.toString()));
    }

    @Test
    @Transactional
    void getTransfersByIdFiltering() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        Long id = transfer.getId();

        defaultTransferFiltering("id.equals=" + id, "id.notEquals=" + id);

        defaultTransferFiltering("id.greaterThanOrEqual=" + id, "id.greaterThan=" + id);

        defaultTransferFiltering("id.lessThanOrEqual=" + id, "id.lessThan=" + id);
    }

    @Test
    @Transactional
    void getAllTransfersByDateIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        // Get all the transferList where date equals to
        defaultTransferFiltering("date.equals=" + DEFAULT_DATE, "date.equals=" + UPDATED_DATE);
    }

    @Test
    @Transactional
    void getAllTransfersByDateIsInShouldWork() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        // Get all the transferList where date in
        defaultTransferFiltering("date.in=" + DEFAULT_DATE + "," + UPDATED_DATE, "date.in=" + UPDATED_DATE);
    }

    @Test
    @Transactional
    void getAllTransfersByDateIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        // Get all the transferList where date is not null
        defaultTransferFiltering("date.specified=true", "date.specified=false");
    }

    @Test
    @Transactional
    void getAllTransfersByAmountIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        // Get all the transferList where amount equals to
        defaultTransferFiltering("amount.equals=" + DEFAULT_AMOUNT, "amount.equals=" + UPDATED_AMOUNT);
    }

    @Test
    @Transactional
    void getAllTransfersByAmountIsInShouldWork() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        // Get all the transferList where amount in
        defaultTransferFiltering("amount.in=" + DEFAULT_AMOUNT + "," + UPDATED_AMOUNT, "amount.in=" + UPDATED_AMOUNT);
    }

    @Test
    @Transactional
    void getAllTransfersByAmountIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        // Get all the transferList where amount is not null
        defaultTransferFiltering("amount.specified=true", "amount.specified=false");
    }

    @Test
    @Transactional
    void getAllTransfersByAmountIsGreaterThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        // Get all the transferList where amount is greater than or equal to
        defaultTransferFiltering("amount.greaterThanOrEqual=" + DEFAULT_AMOUNT, "amount.greaterThanOrEqual=" + UPDATED_AMOUNT);
    }

    @Test
    @Transactional
    void getAllTransfersByAmountIsLessThanOrEqualToSomething() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        // Get all the transferList where amount is less than or equal to
        defaultTransferFiltering("amount.lessThanOrEqual=" + DEFAULT_AMOUNT, "amount.lessThanOrEqual=" + SMALLER_AMOUNT);
    }

    @Test
    @Transactional
    void getAllTransfersByAmountIsLessThanSomething() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        // Get all the transferList where amount is less than
        defaultTransferFiltering("amount.lessThan=" + UPDATED_AMOUNT, "amount.lessThan=" + DEFAULT_AMOUNT);
    }

    @Test
    @Transactional
    void getAllTransfersByAmountIsGreaterThanSomething() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        // Get all the transferList where amount is greater than
        defaultTransferFiltering("amount.greaterThan=" + SMALLER_AMOUNT, "amount.greaterThan=" + DEFAULT_AMOUNT);
    }

    @Test
    @Transactional
    void getAllTransfersByNotesIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        // Get all the transferList where notes equals to
        defaultTransferFiltering("notes.equals=" + DEFAULT_NOTES, "notes.equals=" + UPDATED_NOTES);
    }

    @Test
    @Transactional
    void getAllTransfersByNotesIsInShouldWork() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        // Get all the transferList where notes in
        defaultTransferFiltering("notes.in=" + DEFAULT_NOTES + "," + UPDATED_NOTES, "notes.in=" + UPDATED_NOTES);
    }

    @Test
    @Transactional
    void getAllTransfersByNotesIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        // Get all the transferList where notes is not null
        defaultTransferFiltering("notes.specified=true", "notes.specified=false");
    }

    @Test
    @Transactional
    void getAllTransfersByNotesContainsSomething() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        // Get all the transferList where notes contains
        defaultTransferFiltering("notes.contains=" + DEFAULT_NOTES, "notes.contains=" + UPDATED_NOTES);
    }

    @Test
    @Transactional
    void getAllTransfersByNotesNotContainsSomething() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        // Get all the transferList where notes does not contain
        defaultTransferFiltering("notes.doesNotContain=" + UPDATED_NOTES, "notes.doesNotContain=" + DEFAULT_NOTES);
    }

    @Test
    @Transactional
    void getAllTransfersByCreatedAtIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        // Get all the transferList where createdAt equals to
        defaultTransferFiltering("createdAt.equals=" + DEFAULT_CREATED_AT, "createdAt.equals=" + UPDATED_CREATED_AT);
    }

    @Test
    @Transactional
    void getAllTransfersByCreatedAtIsInShouldWork() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        // Get all the transferList where createdAt in
        defaultTransferFiltering("createdAt.in=" + DEFAULT_CREATED_AT + "," + UPDATED_CREATED_AT, "createdAt.in=" + UPDATED_CREATED_AT);
    }

    @Test
    @Transactional
    void getAllTransfersByCreatedAtIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        // Get all the transferList where createdAt is not null
        defaultTransferFiltering("createdAt.specified=true", "createdAt.specified=false");
    }

    @Test
    @Transactional
    void getAllTransfersByUpdatedAtIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        // Get all the transferList where updatedAt equals to
        defaultTransferFiltering("updatedAt.equals=" + DEFAULT_UPDATED_AT, "updatedAt.equals=" + UPDATED_UPDATED_AT);
    }

    @Test
    @Transactional
    void getAllTransfersByUpdatedAtIsInShouldWork() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        // Get all the transferList where updatedAt in
        defaultTransferFiltering("updatedAt.in=" + DEFAULT_UPDATED_AT + "," + UPDATED_UPDATED_AT, "updatedAt.in=" + UPDATED_UPDATED_AT);
    }

    @Test
    @Transactional
    void getAllTransfersByUpdatedAtIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        // Get all the transferList where updatedAt is not null
        defaultTransferFiltering("updatedAt.specified=true", "updatedAt.specified=false");
    }

    @Test
    @Transactional
    void getAllTransfersByBusinessIsEqualToSomething() throws Exception {
        Business business;
        if (TestUtil.findAll(em, Business.class).isEmpty()) {
            transferRepository.saveAndFlush(transfer);
            business = BusinessResourceIT.createEntity();
        } else {
            business = TestUtil.findAll(em, Business.class).get(0);
        }
        em.persist(business);
        em.flush();
        transfer.setBusiness(business);
        transferRepository.saveAndFlush(transfer);
        Long businessId = business.getId();
        // Get all the transferList where business equals to businessId
        defaultTransferShouldBeFound("businessId.equals=" + businessId);

        // Get all the transferList where business equals to (businessId + 1)
        defaultTransferShouldNotBeFound("businessId.equals=" + (businessId + 1));
    }

    @Test
    @Transactional
    void getAllTransfersByFromAccountIsEqualToSomething() throws Exception {
        Account fromAccount;
        if (TestUtil.findAll(em, Account.class).isEmpty()) {
            transferRepository.saveAndFlush(transfer);
            fromAccount = AccountResourceIT.createEntity();
        } else {
            fromAccount = TestUtil.findAll(em, Account.class).get(0);
        }
        em.persist(fromAccount);
        em.flush();
        transfer.setFromAccount(fromAccount);
        transferRepository.saveAndFlush(transfer);
        Long fromAccountId = fromAccount.getId();
        // Get all the transferList where fromAccount equals to fromAccountId
        defaultTransferShouldBeFound("fromAccountId.equals=" + fromAccountId);

        // Get all the transferList where fromAccount equals to (fromAccountId + 1)
        defaultTransferShouldNotBeFound("fromAccountId.equals=" + (fromAccountId + 1));
    }

    @Test
    @Transactional
    void getAllTransfersByToAccountIsEqualToSomething() throws Exception {
        Account toAccount;
        if (TestUtil.findAll(em, Account.class).isEmpty()) {
            transferRepository.saveAndFlush(transfer);
            toAccount = AccountResourceIT.createEntity();
        } else {
            toAccount = TestUtil.findAll(em, Account.class).get(0);
        }
        em.persist(toAccount);
        em.flush();
        transfer.setToAccount(toAccount);
        transferRepository.saveAndFlush(transfer);
        Long toAccountId = toAccount.getId();
        // Get all the transferList where toAccount equals to toAccountId
        defaultTransferShouldBeFound("toAccountId.equals=" + toAccountId);

        // Get all the transferList where toAccount equals to (toAccountId + 1)
        defaultTransferShouldNotBeFound("toAccountId.equals=" + (toAccountId + 1));
    }

    private void defaultTransferFiltering(String shouldBeFound, String shouldNotBeFound) throws Exception {
        defaultTransferShouldBeFound(shouldBeFound);
        defaultTransferShouldNotBeFound(shouldNotBeFound);
    }

    /**
     * Executes the search, and checks that the default entity is returned.
     */
    private void defaultTransferShouldBeFound(String filter) throws Exception {
        restTransferMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(transfer.getId().intValue())))
            .andExpect(jsonPath("$.[*].date").value(hasItem(DEFAULT_DATE.toString())))
            .andExpect(jsonPath("$.[*].amount").value(hasItem(sameNumber(DEFAULT_AMOUNT))))
            .andExpect(jsonPath("$.[*].notes").value(hasItem(DEFAULT_NOTES)))
            .andExpect(jsonPath("$.[*].createdAt").value(hasItem(DEFAULT_CREATED_AT.toString())))
            .andExpect(jsonPath("$.[*].updatedAt").value(hasItem(DEFAULT_UPDATED_AT.toString())));

        // Check, that the count call also returns 1
        restTransferMockMvc
            .perform(get(ENTITY_API_URL + "/count?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(content().string("1"));
    }

    /**
     * Executes the search, and checks that the default entity is not returned.
     */
    private void defaultTransferShouldNotBeFound(String filter) throws Exception {
        restTransferMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$").isEmpty());

        // Check, that the count call also returns 0
        restTransferMockMvc
            .perform(get(ENTITY_API_URL + "/count?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(content().string("0"));
    }

    @Test
    @Transactional
    void getNonExistingTransfer() throws Exception {
        // Get the transfer
        restTransferMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingTransfer() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the transfer
        Transfer updatedTransfer = transferRepository.findById(transfer.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedTransfer are not directly saved in db
        em.detach(updatedTransfer);
        updatedTransfer
            .date(UPDATED_DATE)
            .amount(UPDATED_AMOUNT)
            .notes(UPDATED_NOTES)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT);
        TransferDTO transferDTO = transferMapper.toDto(updatedTransfer);

        restTransferMockMvc
            .perform(
                put(ENTITY_API_URL_ID, transferDTO.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(transferDTO))
            )
            .andExpect(status().isOk());

        // Validate the Transfer in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedTransferToMatchAllProperties(updatedTransfer);
    }

    @Test
    @Transactional
    void putNonExistingTransfer() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        transfer.setId(longCount.incrementAndGet());

        // Create the Transfer
        TransferDTO transferDTO = transferMapper.toDto(transfer);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restTransferMockMvc
            .perform(
                put(ENTITY_API_URL_ID, transferDTO.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(transferDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Transfer in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchTransfer() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        transfer.setId(longCount.incrementAndGet());

        // Create the Transfer
        TransferDTO transferDTO = transferMapper.toDto(transfer);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restTransferMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(transferDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Transfer in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamTransfer() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        transfer.setId(longCount.incrementAndGet());

        // Create the Transfer
        TransferDTO transferDTO = transferMapper.toDto(transfer);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restTransferMockMvc
            .perform(put(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(transferDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Transfer in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdateTransferWithPatch() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the transfer using partial update
        Transfer partialUpdatedTransfer = new Transfer();
        partialUpdatedTransfer.setId(transfer.getId());

        partialUpdatedTransfer.amount(UPDATED_AMOUNT).notes(UPDATED_NOTES).updatedAt(UPDATED_UPDATED_AT);

        restTransferMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedTransfer.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedTransfer))
            )
            .andExpect(status().isOk());

        // Validate the Transfer in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertTransferUpdatableFieldsEquals(createUpdateProxyForBean(partialUpdatedTransfer, transfer), getPersistedTransfer(transfer));
    }

    @Test
    @Transactional
    void fullUpdateTransferWithPatch() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the transfer using partial update
        Transfer partialUpdatedTransfer = new Transfer();
        partialUpdatedTransfer.setId(transfer.getId());

        partialUpdatedTransfer
            .date(UPDATED_DATE)
            .amount(UPDATED_AMOUNT)
            .notes(UPDATED_NOTES)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT);

        restTransferMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedTransfer.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedTransfer))
            )
            .andExpect(status().isOk());

        // Validate the Transfer in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertTransferUpdatableFieldsEquals(partialUpdatedTransfer, getPersistedTransfer(partialUpdatedTransfer));
    }

    @Test
    @Transactional
    void patchNonExistingTransfer() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        transfer.setId(longCount.incrementAndGet());

        // Create the Transfer
        TransferDTO transferDTO = transferMapper.toDto(transfer);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restTransferMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, transferDTO.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(transferDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Transfer in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchTransfer() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        transfer.setId(longCount.incrementAndGet());

        // Create the Transfer
        TransferDTO transferDTO = transferMapper.toDto(transfer);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restTransferMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(transferDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Transfer in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamTransfer() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        transfer.setId(longCount.incrementAndGet());

        // Create the Transfer
        TransferDTO transferDTO = transferMapper.toDto(transfer);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restTransferMockMvc
            .perform(patch(ENTITY_API_URL).contentType("application/merge-patch+json").content(om.writeValueAsBytes(transferDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Transfer in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteTransfer() throws Exception {
        // Initialize the database
        insertedTransfer = transferRepository.saveAndFlush(transfer);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the transfer
        restTransferMockMvc
            .perform(delete(ENTITY_API_URL_ID, transfer.getId()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return transferRepository.count();
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

    protected Transfer getPersistedTransfer(Transfer transfer) {
        return transferRepository.findById(transfer.getId()).orElseThrow();
    }

    protected void assertPersistedTransferToMatchAllProperties(Transfer expectedTransfer) {
        assertTransferAllPropertiesEquals(expectedTransfer, getPersistedTransfer(expectedTransfer));
    }

    protected void assertPersistedTransferToMatchUpdatableProperties(Transfer expectedTransfer) {
        assertTransferAllUpdatablePropertiesEquals(expectedTransfer, getPersistedTransfer(expectedTransfer));
    }
}
