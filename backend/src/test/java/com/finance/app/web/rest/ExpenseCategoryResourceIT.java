package com.finance.app.web.rest;

import static com.finance.app.domain.ExpenseCategoryAsserts.*;
import static com.finance.app.web.rest.TestUtil.createUpdateProxyForBean;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.app.IntegrationTest;
import com.finance.app.domain.ExpenseCategory;
import com.finance.app.repository.ExpenseCategoryRepository;
import com.finance.app.service.ExpenseCategoryService;
import com.finance.app.service.dto.ExpenseCategoryDTO;
import com.finance.app.service.mapper.ExpenseCategoryMapper;
import jakarta.persistence.EntityManager;
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
 * Integration tests for the {@link ExpenseCategoryResource} REST controller.
 */
@IntegrationTest
@ExtendWith(MockitoExtension.class)
@AutoConfigureMockMvc
@WithMockUser
class ExpenseCategoryResourceIT {

    private static final String DEFAULT_NAME = "AAAAAAAAAA";
    private static final String UPDATED_NAME = "BBBBBBBBBB";

    private static final Boolean DEFAULT_DELETED = false;
    private static final Boolean UPDATED_DELETED = true;

    private static final Instant DEFAULT_CREATED_AT = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_CREATED_AT = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final Instant DEFAULT_UPDATED_AT = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_UPDATED_AT = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final String ENTITY_API_URL = "/api/expense-categories";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2L * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private ExpenseCategoryRepository expenseCategoryRepository;

    @Mock
    private ExpenseCategoryRepository expenseCategoryRepositoryMock;

    @Autowired
    private ExpenseCategoryMapper expenseCategoryMapper;

    @Mock
    private ExpenseCategoryService expenseCategoryServiceMock;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restExpenseCategoryMockMvc;

    private ExpenseCategory expenseCategory;

    private ExpenseCategory insertedExpenseCategory;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static ExpenseCategory createEntity() {
        return new ExpenseCategory()
            .name(DEFAULT_NAME)
            .deleted(DEFAULT_DELETED)
            .createdAt(DEFAULT_CREATED_AT)
            .updatedAt(DEFAULT_UPDATED_AT);
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static ExpenseCategory createUpdatedEntity() {
        return new ExpenseCategory()
            .name(UPDATED_NAME)
            .deleted(UPDATED_DELETED)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT);
    }

    @BeforeEach
    void initTest() {
        expenseCategory = createEntity();
    }

    @AfterEach
    void cleanup() {
        if (insertedExpenseCategory != null) {
            expenseCategoryRepository.delete(insertedExpenseCategory);
            insertedExpenseCategory = null;
        }
    }

    @Test
    @Transactional
    void createExpenseCategory() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        // Create the ExpenseCategory
        ExpenseCategoryDTO expenseCategoryDTO = expenseCategoryMapper.toDto(expenseCategory);
        var returnedExpenseCategoryDTO = om.readValue(
            restExpenseCategoryMockMvc
                .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(expenseCategoryDTO)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            ExpenseCategoryDTO.class
        );

        // Validate the ExpenseCategory in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedExpenseCategory = expenseCategoryMapper.toEntity(returnedExpenseCategoryDTO);
        assertExpenseCategoryUpdatableFieldsEquals(returnedExpenseCategory, getPersistedExpenseCategory(returnedExpenseCategory));

        insertedExpenseCategory = returnedExpenseCategory;
    }

    @Test
    @Transactional
    void createExpenseCategoryWithExistingId() throws Exception {
        // Create the ExpenseCategory with an existing ID
        expenseCategory.setId(1L);
        ExpenseCategoryDTO expenseCategoryDTO = expenseCategoryMapper.toDto(expenseCategory);

        long databaseSizeBeforeCreate = getRepositoryCount();

        // An entity with an existing ID cannot be created, so this API call must fail
        restExpenseCategoryMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(expenseCategoryDTO)))
            .andExpect(status().isBadRequest());

        // Validate the ExpenseCategory in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
    }

    @Test
    @Transactional
    void checkNameIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        expenseCategory.setName(null);

        // Create the ExpenseCategory, which fails.
        ExpenseCategoryDTO expenseCategoryDTO = expenseCategoryMapper.toDto(expenseCategory);

        restExpenseCategoryMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(expenseCategoryDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void checkCreatedAtIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        // set the field null
        expenseCategory.setCreatedAt(null);

        // Create the ExpenseCategory, which fails.
        ExpenseCategoryDTO expenseCategoryDTO = expenseCategoryMapper.toDto(expenseCategory);

        restExpenseCategoryMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(expenseCategoryDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);
    }

    @Test
    @Transactional
    void getAllExpenseCategories() throws Exception {
        // Initialize the database
        insertedExpenseCategory = expenseCategoryRepository.saveAndFlush(expenseCategory);

        // Get all the expenseCategoryList
        restExpenseCategoryMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(expenseCategory.getId().intValue())))
            .andExpect(jsonPath("$.[*].name").value(hasItem(DEFAULT_NAME)))
            .andExpect(jsonPath("$.[*].deleted").value(hasItem(DEFAULT_DELETED)))
            .andExpect(jsonPath("$.[*].createdAt").value(hasItem(DEFAULT_CREATED_AT.toString())))
            .andExpect(jsonPath("$.[*].updatedAt").value(hasItem(DEFAULT_UPDATED_AT.toString())));
    }

    @SuppressWarnings({ "unchecked" })
    void getAllExpenseCategoriesWithEagerRelationshipsIsEnabled() throws Exception {
        when(expenseCategoryServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restExpenseCategoryMockMvc.perform(get(ENTITY_API_URL + "?eagerload=true")).andExpect(status().isOk());

        verify(expenseCategoryServiceMock, times(1)).findAllWithEagerRelationships(any());
    }

    @SuppressWarnings({ "unchecked" })
    void getAllExpenseCategoriesWithEagerRelationshipsIsNotEnabled() throws Exception {
        when(expenseCategoryServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restExpenseCategoryMockMvc.perform(get(ENTITY_API_URL + "?eagerload=false")).andExpect(status().isOk());
        verify(expenseCategoryRepositoryMock, times(1)).findAll(any(Pageable.class));
    }

    @Test
    @Transactional
    void getExpenseCategory() throws Exception {
        // Initialize the database
        insertedExpenseCategory = expenseCategoryRepository.saveAndFlush(expenseCategory);

        // Get the expenseCategory
        restExpenseCategoryMockMvc
            .perform(get(ENTITY_API_URL_ID, expenseCategory.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(expenseCategory.getId().intValue()))
            .andExpect(jsonPath("$.name").value(DEFAULT_NAME))
            .andExpect(jsonPath("$.deleted").value(DEFAULT_DELETED))
            .andExpect(jsonPath("$.createdAt").value(DEFAULT_CREATED_AT.toString()))
            .andExpect(jsonPath("$.updatedAt").value(DEFAULT_UPDATED_AT.toString()));
    }

    @Test
    @Transactional
    void getNonExistingExpenseCategory() throws Exception {
        // Get the expenseCategory
        restExpenseCategoryMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingExpenseCategory() throws Exception {
        // Initialize the database
        insertedExpenseCategory = expenseCategoryRepository.saveAndFlush(expenseCategory);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the expenseCategory
        ExpenseCategory updatedExpenseCategory = expenseCategoryRepository.findById(expenseCategory.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedExpenseCategory are not directly saved in db
        em.detach(updatedExpenseCategory);
        updatedExpenseCategory.name(UPDATED_NAME).deleted(UPDATED_DELETED).createdAt(UPDATED_CREATED_AT).updatedAt(UPDATED_UPDATED_AT);
        ExpenseCategoryDTO expenseCategoryDTO = expenseCategoryMapper.toDto(updatedExpenseCategory);

        restExpenseCategoryMockMvc
            .perform(
                put(ENTITY_API_URL_ID, expenseCategoryDTO.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(expenseCategoryDTO))
            )
            .andExpect(status().isOk());

        // Validate the ExpenseCategory in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedExpenseCategoryToMatchAllProperties(updatedExpenseCategory);
    }

    @Test
    @Transactional
    void putNonExistingExpenseCategory() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        expenseCategory.setId(longCount.incrementAndGet());

        // Create the ExpenseCategory
        ExpenseCategoryDTO expenseCategoryDTO = expenseCategoryMapper.toDto(expenseCategory);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restExpenseCategoryMockMvc
            .perform(
                put(ENTITY_API_URL_ID, expenseCategoryDTO.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(expenseCategoryDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the ExpenseCategory in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithIdMismatchExpenseCategory() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        expenseCategory.setId(longCount.incrementAndGet());

        // Create the ExpenseCategory
        ExpenseCategoryDTO expenseCategoryDTO = expenseCategoryMapper.toDto(expenseCategory);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restExpenseCategoryMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(expenseCategoryDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the ExpenseCategory in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamExpenseCategory() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        expenseCategory.setId(longCount.incrementAndGet());

        // Create the ExpenseCategory
        ExpenseCategoryDTO expenseCategoryDTO = expenseCategoryMapper.toDto(expenseCategory);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restExpenseCategoryMockMvc
            .perform(put(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(expenseCategoryDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the ExpenseCategory in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void partialUpdateExpenseCategoryWithPatch() throws Exception {
        // Initialize the database
        insertedExpenseCategory = expenseCategoryRepository.saveAndFlush(expenseCategory);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the expenseCategory using partial update
        ExpenseCategory partialUpdatedExpenseCategory = new ExpenseCategory();
        partialUpdatedExpenseCategory.setId(expenseCategory.getId());

        partialUpdatedExpenseCategory.deleted(UPDATED_DELETED).updatedAt(UPDATED_UPDATED_AT);

        restExpenseCategoryMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedExpenseCategory.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedExpenseCategory))
            )
            .andExpect(status().isOk());

        // Validate the ExpenseCategory in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertExpenseCategoryUpdatableFieldsEquals(
            createUpdateProxyForBean(partialUpdatedExpenseCategory, expenseCategory),
            getPersistedExpenseCategory(expenseCategory)
        );
    }

    @Test
    @Transactional
    void fullUpdateExpenseCategoryWithPatch() throws Exception {
        // Initialize the database
        insertedExpenseCategory = expenseCategoryRepository.saveAndFlush(expenseCategory);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the expenseCategory using partial update
        ExpenseCategory partialUpdatedExpenseCategory = new ExpenseCategory();
        partialUpdatedExpenseCategory.setId(expenseCategory.getId());

        partialUpdatedExpenseCategory
            .name(UPDATED_NAME)
            .deleted(UPDATED_DELETED)
            .createdAt(UPDATED_CREATED_AT)
            .updatedAt(UPDATED_UPDATED_AT);

        restExpenseCategoryMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedExpenseCategory.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedExpenseCategory))
            )
            .andExpect(status().isOk());

        // Validate the ExpenseCategory in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertExpenseCategoryUpdatableFieldsEquals(
            partialUpdatedExpenseCategory,
            getPersistedExpenseCategory(partialUpdatedExpenseCategory)
        );
    }

    @Test
    @Transactional
    void patchNonExistingExpenseCategory() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        expenseCategory.setId(longCount.incrementAndGet());

        // Create the ExpenseCategory
        ExpenseCategoryDTO expenseCategoryDTO = expenseCategoryMapper.toDto(expenseCategory);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restExpenseCategoryMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, expenseCategoryDTO.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(expenseCategoryDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the ExpenseCategory in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithIdMismatchExpenseCategory() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        expenseCategory.setId(longCount.incrementAndGet());

        // Create the ExpenseCategory
        ExpenseCategoryDTO expenseCategoryDTO = expenseCategoryMapper.toDto(expenseCategory);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restExpenseCategoryMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(expenseCategoryDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the ExpenseCategory in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamExpenseCategory() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        expenseCategory.setId(longCount.incrementAndGet());

        // Create the ExpenseCategory
        ExpenseCategoryDTO expenseCategoryDTO = expenseCategoryMapper.toDto(expenseCategory);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restExpenseCategoryMockMvc
            .perform(patch(ENTITY_API_URL).contentType("application/merge-patch+json").content(om.writeValueAsBytes(expenseCategoryDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the ExpenseCategory in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
    }

    @Test
    @Transactional
    void deleteExpenseCategory() throws Exception {
        // Initialize the database
        insertedExpenseCategory = expenseCategoryRepository.saveAndFlush(expenseCategory);

        long databaseSizeBeforeDelete = getRepositoryCount();

        // Delete the expenseCategory
        restExpenseCategoryMockMvc
            .perform(delete(ENTITY_API_URL_ID, expenseCategory.getId()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
    }

    protected long getRepositoryCount() {
        return expenseCategoryRepository.count();
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

    protected ExpenseCategory getPersistedExpenseCategory(ExpenseCategory expenseCategory) {
        return expenseCategoryRepository.findById(expenseCategory.getId()).orElseThrow();
    }

    protected void assertPersistedExpenseCategoryToMatchAllProperties(ExpenseCategory expectedExpenseCategory) {
        assertExpenseCategoryAllPropertiesEquals(expectedExpenseCategory, getPersistedExpenseCategory(expectedExpenseCategory));
    }

    protected void assertPersistedExpenseCategoryToMatchUpdatableProperties(ExpenseCategory expectedExpenseCategory) {
        assertExpenseCategoryAllUpdatablePropertiesEquals(expectedExpenseCategory, getPersistedExpenseCategory(expectedExpenseCategory));
    }
}
