package com.finance.app.service;

import com.finance.app.domain.Party;
import com.finance.app.repository.PartyRepository;
import com.finance.app.service.dto.PartyDTO;
import com.finance.app.service.mapper.PartyMapper;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link com.finance.app.domain.Party}.
 */
@Service
@Transactional
public class PartyService {

    private static final Logger LOG = LoggerFactory.getLogger(PartyService.class);

    private final PartyRepository partyRepository;

    private final PartyMapper partyMapper;

    public PartyService(PartyRepository partyRepository, PartyMapper partyMapper) {
        this.partyRepository = partyRepository;
        this.partyMapper = partyMapper;
    }

    /**
     * Save a party.
     *
     * @param partyDTO the entity to save.
     * @return the persisted entity.
     */
    public PartyDTO save(PartyDTO partyDTO) {
        LOG.debug("Request to save Party : {}", partyDTO);
        Party party = partyMapper.toEntity(partyDTO);
        party = partyRepository.save(party);
        return partyMapper.toDto(party);
    }

    /**
     * Update a party.
     *
     * @param partyDTO the entity to save.
     * @return the persisted entity.
     */
    public PartyDTO update(PartyDTO partyDTO) {
        LOG.debug("Request to update Party : {}", partyDTO);
        Party party = partyMapper.toEntity(partyDTO);
        party = partyRepository.save(party);
        return partyMapper.toDto(party);
    }

    /**
     * Partially update a party.
     *
     * @param partyDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<PartyDTO> partialUpdate(PartyDTO partyDTO) {
        LOG.debug("Request to partially update Party : {}", partyDTO);

        return partyRepository
            .findById(partyDTO.getId())
            .map(existingParty -> {
                partyMapper.partialUpdate(existingParty, partyDTO);

                return existingParty;
            })
            .map(partyRepository::save)
            .map(partyMapper::toDto);
    }

    /**
     * Get all the parties with eager load of many-to-many relationships.
     *
     * @return the list of entities.
     */
    public Page<PartyDTO> findAllWithEagerRelationships(Pageable pageable) {
        return partyRepository.findAllWithEagerRelationships(pageable).map(partyMapper::toDto);
    }

    /**
     * Get one party by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<PartyDTO> findOne(Long id) {
        LOG.debug("Request to get Party : {}", id);
        return partyRepository.findOneWithEagerRelationships(id).map(partyMapper::toDto);
    }

    /**
     * Delete the party by id.
     *
     * @param id the id of the entity.
     */
    public void delete(Long id) {
        LOG.debug("Request to delete Party : {}", id);
        partyRepository
            .findById(id)
            .ifPresent(party -> {
                party.setDeleted(true);
                partyRepository.save(party);
            });
    }
}
